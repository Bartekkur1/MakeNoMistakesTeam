--!strict
local PathfindingService = game:GetService("PathfindingService")

local NPCNavigation = {}

-- Named configuration constants per D-08, D-10, D-11
NPCNavigation.NOTICE_DISTANCE = 28
NPCNavigation.STOP_DISTANCE = 7
NPCNavigation.BREAK_DISTANCE = 32
NPCNavigation.FOLLOW_GRACE = 5
NPCNavigation.PATH_TIMEOUT = 8

export type NavigationResult = "arrived" | "cancelled" | "no_path" | "timeout" | "lost_player"

export type NavigationToken = {
	isCancelled: boolean,
	revision: number,
	cancel: () -> (),
}

export type ArbiterConfig = {
	noticeDistance: number?,
	stopDistance: number?,
	breakDistance: number?,
	followGrace: number?,
	pathTimeout: number?,
}

export type Arbiter = {
	getOwner: () -> Player?,
	tryClaim: (player: Player, revision: number?) -> boolean,
	enqueue: (player: Player) -> (),
	advanceQueue: () -> Player?,
	releaseOwner: (player: Player) -> Player?,
	cancelPlayer: (player: Player) -> (),
	isOwner: (player: Player) -> boolean,
	getToken: (player: Player) -> NavigationToken?,
	createToken: (player: Player, revision: number) -> NavigationToken,
	getQueueLength: () -> number,
}

function NPCNavigation.createToken(revision: number?): NavigationToken
	local token = {
		isCancelled = false,
		revision = revision or 1,
	}
	token.cancel = function()
		token.isCancelled = true
	end
	return token
end

function NPCNavigation.newArbiter(_config: ArbiterConfig?): Arbiter
	local currentOwner: Player? = nil
	local ownerTokens: { [Player]: NavigationToken } = {}
	local queue: { Player } = {}
	local queueTimes: { [Player]: number } = {}

	local arbiter: Arbiter = {} :: Arbiter

	function arbiter.getOwner(): Player?
		return currentOwner
	end

	function arbiter.isOwner(player: Player): boolean
		return currentOwner == player
	end

	function arbiter.getToken(player: Player): NavigationToken?
		return ownerTokens[player]
	end

	function arbiter.getQueueLength(): number
		return #queue
	end

	function arbiter.createToken(player: Player, revision: number): NavigationToken
		local prevToken = ownerTokens[player]
		if prevToken then
			prevToken.cancel()
		end

		local token = NPCNavigation.createToken(revision)
		ownerTokens[player] = token
		return token
	end

	function arbiter.enqueue(player: Player)
		if currentOwner == player then
			return
		end
		for _, p in ipairs(queue) do
			if p == player then
				return
			end
		end
		table.insert(queue, player)
		queueTimes[player] = os.clock()

		-- Sort FIFO by enqueue time, tie-break by UserId per D-24
		table.sort(queue, function(a, b)
			local tA = queueTimes[a] or 0
			local tB = queueTimes[b] or 0
			if tA == tB then
				return a.UserId < b.UserId
			end
			return tA < tB
		end)
	end

	function arbiter.tryClaim(player: Player, revision: number?): boolean
		if currentOwner == nil then
			currentOwner = player
			arbiter.createToken(player, revision or 1)
			return true
		end
		return currentOwner == player
	end

	function arbiter.advanceQueue(): Player?
		while #queue > 0 do
			local nextPlayer = table.remove(queue, 1)
			queueTimes[nextPlayer] = nil
			if nextPlayer and nextPlayer.Parent and nextPlayer.Character then
				currentOwner = nextPlayer
				arbiter.createToken(nextPlayer, 1)
				return nextPlayer
			end
		end
		return nil
	end

	function arbiter.releaseOwner(player: Player): Player?
		if currentOwner == player then
			local token = ownerTokens[player]
			if token then
				token.cancel()
				ownerTokens[player] = nil
			end
			currentOwner = nil
		end
		return arbiter.advanceQueue()
	end

	function arbiter.cancelPlayer(player: Player)
		for i, p in ipairs(queue) do
			if p == player then
				table.remove(queue, i)
				queueTimes[player] = nil
				break
			end
		end
		local token = ownerTokens[player]
		if token then
			token.cancel()
			ownerTokens[player] = nil
		end
		if currentOwner == player then
			currentOwner = nil
		end
	end

	return arbiter
end

-- Default shared arbiter for MatiBuilds
local defaultArbiter = NPCNavigation.newArbiter()

function NPCNavigation.getDefaultArbiter(): Arbiter
	return defaultArbiter
end

function NPCNavigation.cancelPlayer(player: Player)
	defaultArbiter.cancelPlayer(player)
end

function NPCNavigation.releaseOwner(player: Player): Player?
	return defaultArbiter.releaseOwner(player)
end

function NPCNavigation.walkToPlayer(
	character: Model,
	targetPlayer: Player,
	options: { stopDistance: number?, timeout: number? }?,
	token: NavigationToken?
): NavigationResult
	local humanoid = character:FindFirstChildOfClass("Humanoid")
	local rootPart = character:FindFirstChild("HumanoidRootPart") :: BasePart?
	if not humanoid or not rootPart then
		return "no_path"
	end

	local targetChar = targetPlayer.Character
	if not targetChar then
		return "lost_player"
	end
	local targetRoot = targetChar:FindFirstChild("HumanoidRootPart") :: BasePart?
	if not targetRoot then
		return "lost_player"
	end

	local stopDistance = if options and options.stopDistance then options.stopDistance else NPCNavigation.STOP_DISTANCE
	local timeout = if options and options.timeout then options.timeout else NPCNavigation.PATH_TIMEOUT

	-- Immediate proximity check
	local initialDist = (rootPart.Position - targetRoot.Position).Magnitude
	if initialDist <= stopDistance then
		humanoid:MoveTo(rootPart.Position)
		return "arrived"
	end

	local startTime = os.clock()

	-- Path calculation
	local path = PathfindingService:CreatePath({
		AgentRadius = 2.5,
		AgentHeight = 5.0,
		AgentCanJump = false,
		WaypointSpacing = 4.0,
	})

	local computeSuccess, _ = pcall(function()
		path:ComputeAsync(rootPart.Position, targetRoot.Position)
	end)

	if not computeSuccess or path.Status ~= Enum.PathStatus.Success then
		-- Fallback to direct MoveTo if path computation is blocked or failed
		humanoid:MoveTo(targetRoot.Position)
		local moveFinished = false
		local conn = humanoid.MoveToFinished:Connect(function()
			moveFinished = true
		end)

		while not moveFinished do
			if token and token.isCancelled then
				conn:Disconnect()
				humanoid:MoveTo(rootPart.Position)
				return "cancelled"
			end
			if os.clock() - startTime > timeout then
				conn:Disconnect()
				humanoid:MoveTo(rootPart.Position)
				return "timeout"
			end
			if not targetChar.Parent or not targetRoot.Parent then
				conn:Disconnect()
				return "lost_player"
			end
			if (rootPart.Position - targetRoot.Position).Magnitude <= stopDistance then
				conn:Disconnect()
				humanoid:MoveTo(rootPart.Position)
				return "arrived"
			end
			task.wait(0.1)
		end
		conn:Disconnect()

		if (rootPart.Position - targetRoot.Position).Magnitude <= stopDistance + 2 then
			humanoid:MoveTo(rootPart.Position)
			return "arrived"
		end
		return "no_path"
	end

	local waypoints = path:GetWaypoints()
	for _, waypoint in ipairs(waypoints) do
		if token and token.isCancelled then
			humanoid:MoveTo(rootPart.Position)
			return "cancelled"
		end

		if os.clock() - startTime > timeout then
			humanoid:MoveTo(rootPart.Position)
			return "timeout"
		end

		if not targetChar.Parent or not targetRoot.Parent then
			humanoid:MoveTo(rootPart.Position)
			return "lost_player"
		end

		local currentDist = (rootPart.Position - targetRoot.Position).Magnitude
		if currentDist <= stopDistance then
			humanoid:MoveTo(rootPart.Position)
			return "arrived"
		end

		humanoid:MoveTo(waypoint.Position)

		local reachedWaypoint = false
		local conn = humanoid.MoveToFinished:Connect(function()
			reachedWaypoint = true
		end)

		local waypointWait = 0
		while not reachedWaypoint and waypointWait < 1.5 do
			if token and token.isCancelled then
				conn:Disconnect()
				humanoid:MoveTo(rootPart.Position)
				return "cancelled"
			end
			if (rootPart.Position - targetRoot.Position).Magnitude <= stopDistance then
				conn:Disconnect()
				humanoid:MoveTo(rootPart.Position)
				return "arrived"
			end
			task.wait(0.05)
			waypointWait += 0.05
		end
		conn:Disconnect()
	end

	local finalDist = (rootPart.Position - targetRoot.Position).Magnitude
	if finalDist <= stopDistance + 2 then
		humanoid:MoveTo(rootPart.Position)
		return "arrived"
	end

	return "arrived"
end

return NPCNavigation
