--!strict
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local NPCNavigation = require(script.Parent:WaitForChild("NPCNavigation") :: ModuleScript)
local NPCWalkAnimation = require(script.Parent:WaitForChild("NPCWalkAnimation") :: ModuleScript)

local lobby = workspace:WaitForChild("MarketplaceLobby", 10) :: Instance?
local npc = lobby and (lobby:WaitForChild("ScammerNPC", 10) :: Model?)
if not npc then
	return
end

local hrp = npc:WaitForChild("HumanoidRootPart", 5) :: BasePart?
local head = npc:WaitForChild("Head", 5) :: BasePart?
local upperTorso = (npc:FindFirstChild("UpperTorso") or npc:FindFirstChild("Torso")) :: BasePart?
local lowerTorso = (npc:FindFirstChild("LowerTorso") or npc:FindFirstChild("Torso")) :: BasePart?
local humanoid = npc:FindFirstChildOfClass("Humanoid")

if not hrp or not head or not humanoid then
	return
end

humanoid.DisplayName = "MatiBuilds"
humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.Viewer
humanoid.NameDisplayDistance = 100
humanoid.HealthDisplayType = Enum.HumanoidHealthDisplayType.DisplayWhenDamaged
humanoid.WalkSpeed = 8
humanoid.MaxHealth = 100
humanoid.Health = 100
humanoid.RequiresNeck = false
humanoid.BreakJointsOnDeath = false
local stopWalkAnimation = NPCWalkAnimation.start(npc)
npc.Destroying:Connect(stopWalkAnimation)

-- Ensure NPC can physically move via PathfindingService and server has network ownership
hrp.Anchored = false
pcall(function()
	hrp:SetNetworkOwner(nil)
end)

-- Per D-03: Disable ProximityPrompt so interaction is triggered by proximity approach, not [E]
local prompt = hrp:FindFirstChildOfClass("ProximityPrompt")
if prompt then
	prompt.Enabled = false
end

-- Keep only standard player nametag; remove custom badge BillboardGui if present
local customTag = head:FindFirstChild("ScammerTag") or head:FindFirstChildOfClass("BillboardGui")
if customTag then
	customTag:Destroy()
end

local neck = (head:FindFirstChild("Neck") or (upperTorso and upperTorso:FindFirstChild("Neck"))) :: Motor6D?
local waist = (upperTorso:FindFirstChild("Waist") or (lowerTorso and lowerTorso:FindFirstChild("Waist"))) :: Motor6D?

local baseNeckC0 = if neck then neck.C0 else CFrame.new()
local baseWaistC0 = if waist then waist.C0 else CFrame.new()

local arbiter = NPCNavigation.getDefaultArbiter()
local remotes = ReplicatedStorage:WaitForChild("MissionRemotes")
local stateChanged = remotes:WaitForChild("EncounterStateChanged") :: BindableEvent
local publicBubble = remotes:WaitForChild("PublicNpcBubble") :: RemoteEvent

local queryArbiter = remotes:FindFirstChild("QueryArbiter") :: BindableFunction?
if not queryArbiter then
	local fn = Instance.new("BindableFunction")
	fn.Name = "QueryArbiter"
	fn.Parent = remotes
	queryArbiter = fn
end
queryArbiter.OnInvoke = function()
	local q = arbiter.getQueue()
	local qNames = {}
	for _, p in ipairs(q) do
		table.insert(qNames, p.Name)
	end
	return {
		owner = if arbiter.getOwner() then arbiter.getOwner().Name else nil,
		queueLength = arbiter.getQueueLength(),
		queue = qNames,
	}
end

local testEnqueue = remotes:FindFirstChild("TestEnqueuePlayer") :: BindableEvent?
if not testEnqueue then
	local ev = Instance.new("BindableEvent")
	ev.Name = "TestEnqueuePlayer"
	ev.Parent = remotes
	testEnqueue = ev
end
testEnqueue.Event:Connect(function(player: Player)
	arbiter.enqueue(player)
end)

local stages: { [Player]: string } = {}
local suppressed: { [Player]: Vector3 } = {}
stateChanged.Event:Connect(function(player: Player, _revision: number, stage: string)
	stages[player] = stage
	if stage == "closed" or stage == "responding" or stage == "ending_good" or stage == "ending_bad" then
		suppressed[player] = hrp.Position
	elseif stage == "start" then
		suppressed[player] = nil
	end
end)
Players.PlayerRemoving:Connect(function(player)
	stages[player] = nil
	suppressed[player] = nil
end)

-- Breathing & Head tracking
local currentTargetPlayer: Player? = nil
local clock = 0

RunService.Heartbeat:Connect(function(dt: number)
	clock += dt

	-- Gentle breathing
	local breath = math.sin(clock * 2.2) * 0.02
	local sway = math.cos(clock * 1.5) * 0.015

	if waist and baseWaistC0 then
		waist.C0 = baseWaistC0 * CFrame.Angles(breath * 0.5, sway, 0)
	end

	-- Head tracking towards current target player or nearest player
	local targetChar = if currentTargetPlayer then currentTargetPlayer.Character else nil
	if not targetChar then
		local nearestDist = NPCNavigation.NOTICE_DISTANCE
		for _, player in ipairs(Players:GetPlayers()) do
			local char = player.Character
			if char and char:FindFirstChild("HumanoidRootPart") and char:FindFirstChild("Head") then
				local charHrp = char.HumanoidRootPart :: BasePart
				local dist = (charHrp.Position - hrp.Position).Magnitude
				if dist < nearestDist then
					nearestDist = dist
					targetChar = char
				end
			end
		end
	end

	if targetChar and neck and baseNeckC0 then
		local targetHead = targetChar:FindFirstChild("Head") :: BasePart?
		if targetHead and upperTorso then
			local localPos = upperTorso.CFrame:PointToObjectSpace(targetHead.Position)
			local yaw = math.clamp(-math.atan2(localPos.X, localPos.Z) - math.pi, -math.rad(60), math.rad(60))
			local pitch = math.clamp(math.atan2(localPos.Y, -localPos.Z), -math.rad(25), math.rad(25))
			if waist then
				neck.C0 = baseNeckC0 * CFrame.Angles(pitch, yaw, 0)
			else
				neck.C0 = baseNeckC0 * CFrame.Angles(-pitch * 0.7, 0, 0) * CFrame.Angles(0, 0, -yaw * 0.7)
			end
		end
	elseif neck and baseNeckC0 then
		if waist then
			neck.C0 = baseNeckC0 * CFrame.Angles(breath * 0.5, 0, 0)
		else
			neck.C0 = baseNeckC0 * CFrame.Angles(-breath * 0.5, 0, 0)
		end
	end
end)

local function triggerBeginEncounter(player: Player, revision: number)
	local bEvent = remotes:FindFirstChild("BeginEncounterEvent") :: BindableEvent?
	if bEvent then
		bEvent:Fire(player, revision)
	end
end

local function triggerCancelEncounter(player: Player)
	local cEvent = remotes:FindFirstChild("CancelEncounterEvent") :: BindableEvent?
	if cEvent then
		cEvent:Fire(player)
	end
end

-- Patrol waypoints
local basePos = hrp.Position
local patrolPoints = {
	basePos + Vector3.new(0, 0, 0),
	basePos + Vector3.new(6, 0, -5),
	basePos + Vector3.new(-6, 0, -4),
	basePos + Vector3.new(0, 0, 6),
}
local currentPatrolIdx = 1

local isNavigating = false

-- Continuous proximity scanner for FIFO queue management
task.spawn(function()
	while npc and npc.Parent do
		task.wait(0.35)

		for _, player in ipairs(Players:GetPlayers()) do
			local char = player.Character
			local charHrp = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
			local hum = char and char:FindFirstChildOfClass("Humanoid")
			if char and charHrp and charHrp.Parent and hum and hum.Health > 0 then
				local dist = (charHrp.Position - hrp.Position).Magnitude
				local dismissedAt = suppressed[player]
				if dismissedAt and (charHrp.Position - dismissedAt).Magnitude > NPCNavigation.BREAK_DISTANCE then
					suppressed[player] = nil
				end
				local stage = stages[player] or "start"
				local available = (stage == "start" or stage == "closed") and not suppressed[player]

				if available and dist <= NPCNavigation.NOTICE_DISTANCE then
					if not arbiter.isOwner(player) and not arbiter.isInQueue(player) then
						arbiter.enqueue(player)
					end
				elseif arbiter.isInQueue(player) and dist > NPCNavigation.BREAK_DISTANCE then
					arbiter.cancelPlayer(player)
				end
			elseif arbiter.isInQueue(player) then
				arbiter.cancelPlayer(player)
			end
		end
	end
end)

-- Main navigation & encounter worker
task.spawn(function()
	while npc and npc.Parent do
		task.wait(0.2)

		-- Get the next player to serve: active owner or advance from FIFO queue
		local targetPlayer: Player? = arbiter.getOwner()
		if not targetPlayer then
			targetPlayer = arbiter.advanceQueue()
		end

		if targetPlayer then
			local char = targetPlayer.Parent and targetPlayer.Character
			local targetHrp = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
			local hum = char and char:FindFirstChildOfClass("Humanoid")

			if char and targetHrp and hum and hum.Health > 0 then
				isNavigating = true
				currentTargetPlayer = targetPlayer
				local token = arbiter.getToken(targetPlayer)

				-- Walk to player with obstacle avoidance
				local navResult = NPCNavigation.walkToPlayer(
					npc,
					targetPlayer,
					{ stopDistance = NPCNavigation.STOP_DISTANCE, timeout = NPCNavigation.PATH_TIMEOUT },
					token
				)

				if navResult == "arrived" and not (token and token.isCancelled) then
					-- Stop all residual momentum and anchor NPC firmly in place during dialogue
					humanoid:Move(Vector3.zero, false)
					hrp.AssemblyLinearVelocity = Vector3.zero
					hrp.AssemblyAngularVelocity = Vector3.zero
					hrp.Anchored = true

					-- Turn to face player
					if targetHrp and targetHrp.Parent then
						hrp.CFrame = CFrame.lookAt(
							hrp.Position,
							Vector3.new(targetHrp.Position.X, hrp.Position.Y, targetHrp.Position.Z)
						)
					end

					-- A public bubble is visual only; no real player whisper is sent.
					publicBubble:FireAllClients(head, "Hej, fajny skin :)")

					-- Start simulated private chat encounter
					local revision = if token then token.revision else 1
					triggerBeginEncounter(targetPlayer, revision)

					-- Monitor distance and interaction state
					local decisionStartedAt: number? = nil
					local followUntil: number? = nil
					local gavePressureShout = false

					while targetPlayer and targetPlayer.Parent and arbiter.isOwner(targetPlayer) do
						task.wait(0.2)
						local currentChar = targetPlayer.Character
						local cHrp = currentChar and currentChar:FindFirstChild("HumanoidRootPart") :: BasePart?

						if not currentChar or not cHrp or not cHrp.Parent then
							triggerCancelEncounter(targetPlayer)
							break
						end

						local currentDist = (cHrp.Position - hrp.Position).Magnitude
						-- Distance break per D-11: if player walks away further than BREAK_DISTANCE (32 studs)
						if currentDist > NPCNavigation.BREAK_DISTANCE then
							triggerCancelEncounter(targetPlayer)
							arbiter.releaseOwner(targetPlayer)
							break
						end

						-- Keep NPC smoothly facing player while anchored in place
						hrp.CFrame =
							CFrame.lookAt(hrp.Position, Vector3.new(cHrp.Position.X, hrp.Position.Y, cHrp.Position.Z))

						-- Start the response timer after the last private message, never during typing.
						if stages[targetPlayer] == "decision" then
							decisionStartedAt = decisionStartedAt or os.clock()
							if not gavePressureShout and os.clock() - decisionStartedAt >= 10 then
								gavePressureShout = true
								followUntil = os.clock() + 15
								publicBubble:FireAllClients(head, "Zostało jedno miejsce, zaraz przepada!")
							end
							if followUntil and os.clock() >= followUntil then
								triggerCancelEncounter(targetPlayer)
								break
							end
						end
					end

					-- Always unanchor NPC when conversation ends so he can walk again
					hrp.Anchored = false
					pcall(function()
						hrp:SetNetworkOwner(nil)
					end)

					if arbiter.isOwner(targetPlayer) then
						arbiter.releaseOwner(targetPlayer)
					end
				else
					-- Path blocked or timeout or cancelled
					arbiter.releaseOwner(targetPlayer)
				end

				-- Ensure unanchored if loop exited unexpectedly
				hrp.Anchored = false
				pcall(function()
					hrp:SetNetworkOwner(nil)
				end)

				currentTargetPlayer = nil
				isNavigating = false
			else
				-- Target player has invalid character
				arbiter.releaseOwner(targetPlayer)
			end
		else
			-- No players in queue: perform idle patrol
			if not isNavigating and arbiter.getQueueLength() == 0 and not arbiter.getOwner() then
				local targetPoint = patrolPoints[currentPatrolIdx]
				humanoid:MoveTo(targetPoint)
				local reached = false
				local conn = humanoid.MoveToFinished:Connect(function()
					reached = true
				end)

				local waitTime = 0
				while not reached and waitTime < 4 do
					task.wait(0.2)
					waitTime += 0.2
					if arbiter.getQueueLength() > 0 or arbiter.getOwner() then
						break
					end
				end
				conn:Disconnect()

				currentPatrolIdx = (currentPatrolIdx % #patrolPoints) + 1
				local pause = math.random(2, 4)
				local elapsed = 0
				while elapsed < pause do
					task.wait(0.2)
					elapsed += 0.2
					if arbiter.getQueueLength() > 0 or arbiter.getOwner() then
						break
					end
				end
			end
		end
	end
end)
