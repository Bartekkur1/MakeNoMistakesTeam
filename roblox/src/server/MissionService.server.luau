--!strict
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")

local MissionContent = require(ReplicatedStorage:WaitForChild("MissionContent") :: ModuleScript)
local NPCNavigation = require(script.Parent:WaitForChild("NPCNavigation") :: ModuleScript)

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
	revision: number,
	ownerStatus: string,
	histories: {
		mati: { MissionContent.ChatMessage },
		scamerino: { MissionContent.ChatMessage },
	},
	lastActionTime: number,
	activeConversation: string,
}

local playerStates: { [Player]: PlayerState } = {}

local function getOrCreateState(player: Player): PlayerState
	local state = playerStates[player]
	if not state then
		state = {
			stage = "start",
			revision = 1,
			ownerStatus = "none",
			histories = {
				mati = {},
				scamerino = {},
			},
			lastActionTime = 0,
			activeConversation = "none",
		}
		playerStates[player] = state
	end
	return state
end

local function sendSnapshot(player: Player, state: PlayerState)
	local snapshot: MissionContent.MissionSnapshot = {
		revision = state.revision,
		activeConversation = state.activeConversation,
		histories = state.histories,
		choices = MissionContent.choices,
		status = state.stage,
		title = if state.activeConversation == "mati"
			then "MatiBuilds"
			elseif state.activeConversation == "scamerino" then "Scamerino Alertinio"
			else nil,
		interlocutorName = if state.activeConversation == "mati"
			then "MatiBuilds"
			elseif state.activeConversation == "scamerino" then "Scamerino"
			else nil,
	}
	(missionUpdateRemote :: RemoteEvent):FireClient(player, snapshot)
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

local function beginEncounter(player: Player, revision: number?)
	local state = getOrCreateState(player)
	if revision and revision > state.revision then
		state.revision = revision
	end

	state.ownerStatus = "active"
	state.activeConversation = "mati"
	state.stage = "decision"

	-- Populate initial short messages from MatiBuilds per D-14, D-17
	state.histories.mati = {}
	for _, msg in ipairs(MissionContent.initialMatiMessages) do
		table.insert(state.histories.mati, {
			sender = msg.sender,
			text = msg.text,
			time = os.clock(),
		})
	end

	sendSnapshot(player, state)
end

local function cancelEncounter(player: Player)
	local state = playerStates[player]
	if not state then
		return
	end

	state.revision += 1
	state.stage = "closed"
	state.activeConversation = "none"
	state.ownerStatus = "none"
	sendSnapshot(player, state)
end

-- Register BindableEvents for cross-script server communication
local beginEncounterEvent = remotesFolder:FindFirstChild("BeginEncounterEvent")
if not beginEncounterEvent then
	beginEncounterEvent = Instance.new("BindableEvent")
	beginEncounterEvent.Name = "BeginEncounterEvent"
	beginEncounterEvent.Parent = remotesFolder
end
(beginEncounterEvent :: BindableEvent).Event:Connect(function(player: Player, revision: number?)
	beginEncounter(player, revision)
end)

local cancelEncounterEvent = remotesFolder:FindFirstChild("CancelEncounterEvent")
if not cancelEncounterEvent then
	cancelEncounterEvent = Instance.new("BindableEvent")
	cancelEncounterEvent.Name = "CancelEncounterEvent"
	cancelEncounterEvent.Parent = remotesFolder
end
(cancelEncounterEvent :: BindableEvent).Event:Connect(function(player: Player)
	cancelEncounter(player)
end)

-- Handle player actions from client
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
		state.revision += 1
		state.stage = "start"
		state.activeConversation = "none"
		state.ownerStatus = "none"
		state.histories.mati = {}
		state.histories.scamerino = {}
		NPCNavigation.releaseOwner(player)
		teleportToStart(player)
		sendSnapshot(player, state)
		return
	end

	if actionId == "close" then
		state.revision += 1
		state.stage = "closed"
		state.activeConversation = "none"
		state.ownerStatus = "none"
		NPCNavigation.releaseOwner(player)
		sendSnapshot(player, state)
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

	-- Per D-14: append player's selected choice to history as their message
	table.insert(state.histories.mati, {
		sender = "Ty",
		text = choice.label,
		time = now,
	})

	-- Set next stage
	state.stage = choice.nextStage

	if choice.nextStage == "ending_bad" then
		table.insert(state.histories.mati, {
			sender = "MatiBuilds",
			text = "Dzięki za hasło! Zaraz się loguję i doładuję Robuxy...",
			time = now + 0.1,
		})
		table.insert(state.histories.mati, {
			sender = "System",
			text = MissionContent.texts.ending_bad,
			time = now + 0.2,
		})
	elseif choice.nextStage == "ending_good" then
		table.insert(state.histories.mati, {
			sender = "MatiBuilds",
			text = "Ehh, to jak nie chcesz darmowych Robuxów, to twoja sprawa...",
			time = now + 0.1,
		})
		table.insert(state.histories.mati, {
			sender = "System",
			text = MissionContent.texts.ending_good,
			time = now + 0.2,
		})
	end

	sendSnapshot(player, state)
end)

Players.PlayerRemoving:Connect(function(player: Player)
	NPCNavigation.releaseOwner(player)
	playerStates[player] = nil
end)
