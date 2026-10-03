--!strict
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local MissionContent = require(ReplicatedStorage:WaitForChild("MissionContent") :: ModuleScript)

-- Ensure MissionRemotes folder and RemoteEvents exist
local remotesFolder = ReplicatedStorage:FindFirstChild("MissionRemotes")
if not remotesFolder then
	remotesFolder = Instance.new("Folder")
	remotesFolder.Name = "MissionRemotes"
	remotesFolder.Parent = ReplicatedStorage
end

local requestActionRemote = remotesFolder:FindFirstChild("RequestAction")
if not requestActionRemote then
	requestActionRemote = Instance.new("RemoteEvent")
	requestActionRemote.Name = "RequestAction"
	requestActionRemote.Parent = remotesFolder
end

local missionUpdateRemote = remotesFolder:FindFirstChild("MissionUpdate")
if not missionUpdateRemote then
	missionUpdateRemote = Instance.new("RemoteEvent")
	missionUpdateRemote.Name = "MissionUpdate"
	missionUpdateRemote.Parent = remotesFolder
end

type PlayerState = {
	stage: string,
	lastActionTime: number,
}

local playerStates: { [Player]: PlayerState } = {}

local function getOrCreateState(player: Player): PlayerState
	local state = playerStates[player]
	if not state then
		state = {
			stage = "start",
			lastActionTime = 0,
		}
		playerStates[player] = state
	end
	return state
end

local function sendUpdate(player: Player, stage: string)
	(missionUpdateRemote :: RemoteEvent):FireClient(player, stage)
end

-- Teleport character to MissionStart SpawnLocation
local function teleportToStart(player: Player)
	local character = player.Character
	if not character then
		return
	end
	local rootPart = character:FindFirstChild("HumanoidRootPart") :: BasePart?
	local missionStart = Workspace:FindFirstChild("MissionStart") :: BasePart?
	if rootPart and missionStart then
		rootPart.CFrame = missionStart.CFrame + Vector3.new(0, 3, 0)
	end
end

-- Hook ProximityPrompt
local function setupPromptListener()
	local lobby = Workspace:FindFirstChild("MarketplaceLobby")
	if not lobby then
		return
	end
	local scammer = lobby:FindFirstChild("ScammerNPC")
	if not scammer then
		return
	end
	local hrp = scammer:FindFirstChild("HumanoidRootPart")
	if not hrp then
		return
	end
	local prompt = hrp:FindFirstChild("ProximityPrompt") :: ProximityPrompt?
	if prompt then
		prompt.Triggered:Connect(function(player: Player)
			local state = getOrCreateState(player)
			if state.stage == "start" or state.stage == "closed" then
				state.stage = "decision"
				sendUpdate(player, state.stage)
			end
		end)
	end
end

setupPromptListener()

-- Reconnect if scene reloaded
Workspace.ChildAdded:Connect(function(child)
	if child.Name == "MarketplaceLobby" then
		task.wait(0.2)
		setupPromptListener()
	end
end)

-- Handle player actions
local actionRemote = requestActionRemote :: RemoteEvent
actionRemote.OnServerEvent:Connect(function(player: Player, actionId: any)
	if typeof(actionId) ~= "string" then
		return
	end

	local now = os.clock()
	local state = getOrCreateState(player)

	-- Rate limiting: ignore rapid requests within 0.25s
	if now - state.lastActionTime < 0.25 then
		return
	end
	state.lastActionTime = now

	if actionId == "replay" then
		state.stage = "start"
		teleportToStart(player)
		sendUpdate(player, "start")
		return
	end

	if actionId == "close" then
		state.stage = "closed"
		sendUpdate(player, "closed")
		return
	end

	-- Only allow choices when player is in 'decision' stage
	if state.stage ~= "decision" then
		return
	end

	local choice = MissionContent.getChoice(actionId)
	if not choice or not choice.enabled then
		return
	end

	-- Authoritatively set next stage
	state.stage = choice.nextStage
	sendUpdate(player, state.stage)
end)

Players.PlayerRemoving:Connect(function(player: Player)
	playerStates[player] = nil
end)
