--!strict
local Players = game:GetService("Players")
local NPCNavigation = require(script.Parent:WaitForChild("NPCNavigation") :: ModuleScript)

local ScamerinoNPCManager = {}

local modelInstance = workspace:WaitForChild("ScamerinoAlertinio", 15) :: Instance?
local model = if modelInstance and modelInstance:IsA("Model") then modelInstance else nil

type HelpRequest = {
	player: Player,
	revision: number,
	createdAt: number,
	callback: (result: string) -> (),
}

local queue: { HelpRequest } = {}
local currentOwner: Player? = nil
local currentOwnerRevision: number = 0
local isNavigating = false
local currentToken: NPCNavigation.NavigationToken? = nil

local DEADLINE_SECONDS = 12
local NAV_TIMEOUT_SECONDS = 8

local function getRoot(): BasePart?
	if not model then
		return nil
	end
	local hrp = model:FindFirstChild("HumanoidRootPart") or model:FindFirstChild("Torso")
	if hrp and hrp:IsA("BasePart") then
		return hrp
	end
	return nil
end

local function getHead(): BasePart?
	if not model then
		return nil
	end
	local head = model:FindFirstChild("Head")
	if head and head:IsA("BasePart") then
		return head
	end
	return nil
end

local function getSiren(): PointLight?
	local head = getHead()
	local siren = head and head:FindFirstChild("SirenLight")
	if siren and siren:IsA("PointLight") then
		return siren
	end
	return nil
end

local function pausePatrol(paused: boolean)
	if model then
		model:SetAttribute("ScamerinoPatrolPaused", paused)
	end
end

local function processQueue()
	if isNavigating or currentOwner ~= nil then
		return
	end
	if #queue == 0 then
		pausePatrol(false)
		return
	end

	local now = os.clock()
	while #queue > 0 do
		local req = queue[1]
		if not req.player.Parent or (now - req.createdAt) > DEADLINE_SECONDS then
			table.remove(queue, 1)
			pcall(req.callback, "timeout")
		else
			break
		end
	end

	if #queue == 0 then
		pausePatrol(false)
		return
	end

	local req = table.remove(queue, 1) :: HelpRequest
	local targetPlayer = req.player
	local revision = req.revision
	currentOwner = targetPlayer
	currentOwnerRevision = revision
	isNavigating = true
	pausePatrol(true)

	task.spawn(function()
		local token = NPCNavigation.createToken(revision)
		currentToken = token

		local navResult = "no_path"
		if model and targetPlayer.Character then
			navResult = NPCNavigation.walkToPlayer(
				model,
				targetPlayer,
				{ stopDistance = 6, timeout = NAV_TIMEOUT_SECONDS },
				token
			)
		end

		local hrp = getRoot()
		if hrp then
			hrp.AssemblyLinearVelocity = Vector3.zero
			hrp.AssemblyAngularVelocity = Vector3.zero
		end

		if navResult == "arrived" and not token.isCancelled and currentOwner == targetPlayer then
			local char = targetPlayer.Character
			local targetHrp = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
			if hrp and targetHrp then
				pcall(function()
					hrp.CFrame = CFrame.lookAt(
						hrp.Position,
						Vector3.new(targetHrp.Position.X, hrp.Position.Y, targetHrp.Position.Z)
					)
				end)
			end
			isNavigating = false
			pcall(req.callback, "arrived")
		else
			isNavigating = false
			currentOwner = nil
			currentOwnerRevision = 0
			pcall(req.callback, navResult)
			processQueue()
		end
	end)
end

function ScamerinoNPCManager.requestHelp(player: Player, revision: number, callback: (result: string) -> ())
	-- Deduplicate: if player already has pending request in queue or is current owner
	if currentOwner == player and currentOwnerRevision == revision then
		callback("already_owner")
		return
	end
	for _, req in ipairs(queue) do
		if req.player == player and req.revision == revision then
			callback("already_queued")
			return
		end
	end

	local req: HelpRequest = {
		player = player,
		revision = revision,
		createdAt = os.clock(),
		callback = callback,
	}
	table.insert(queue, req)
	processQueue()
end

function ScamerinoNPCManager.cancelPlayer(player: Player)
	for i = #queue, 1, -1 do
		if queue[i].player == player then
			local req = table.remove(queue, i)
			pcall(req.callback, "cancelled")
		end
	end

	if currentOwner == player then
		if currentToken then
			currentToken.cancel()
		end
		currentOwner = nil
		currentOwnerRevision = 0
		isNavigating = false
		pausePatrol(false)
		processQueue()
	end
end

function ScamerinoNPCManager.setOutcome(_player: Player, outcome: string)
	local siren = getSiren()
	if outcome == "alarm" then
		if siren then
			task.spawn(function()
				local origColor = siren.Color
				local origBrightness = siren.Brightness
				siren.Color = Color3.fromRGB(255, 30, 30)
				for _ = 1, 8 do
					siren.Brightness = 3
					siren.Enabled = true
					task.wait(0.25)
					siren.Brightness = 0.5
					task.wait(0.25)
				end
				siren.Color = origColor
				siren.Brightness = origBrightness
			end)
		end
	elseif outcome == "safe" then
		if siren then
			siren.Color = Color3.fromRGB(80, 220, 100)
			siren.Brightness = 2
			task.delay(3, function()
				siren.Color = Color3.fromRGB(255, 180, 20)
				siren.Brightness = 1
			end)
		end
	end
end

function ScamerinoNPCManager.resetForPlayer(player: Player, revision: number)
	for i = #queue, 1, -1 do
		if queue[i].player == player and queue[i].revision == revision then
			table.remove(queue, i)
		end
	end

	if currentOwner == player and currentOwnerRevision == revision then
		if currentToken then
			currentToken.cancel()
		end
		currentOwner = nil
		currentOwnerRevision = 0
		isNavigating = false
		pausePatrol(false)
		processQueue()
	end
end

Players.PlayerRemoving:Connect(function(player)
	ScamerinoNPCManager.cancelPlayer(player)
end)

return ScamerinoNPCManager
