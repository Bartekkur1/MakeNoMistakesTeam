--!strict
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MissionContent = require(ReplicatedStorage:WaitForChild("MissionContent") :: ModuleScript)
local NPCNavigation = require(script.Parent:WaitForChild("NPCNavigation") :: ModuleScript)
local arbiter = NPCNavigation.getDefaultArbiter()

local folder = ReplicatedStorage:FindFirstChild("MissionRemotes")
if not folder then
	folder = Instance.new("Folder")
	folder.Name = "MissionRemotes"
	folder.Parent = ReplicatedStorage
end
local function ensure(name: string, className: string): Instance
	local instance = folder:FindFirstChild(name)
	if not instance then
		instance = Instance.new(className)
		instance.Name = name
		instance.Parent = folder
	end
	return instance
end
local request = ensure("RequestAction", "RemoteEvent") :: RemoteEvent
local update = ensure("MissionUpdate", "RemoteEvent") :: RemoteEvent
local beginEvent = ensure("BeginEncounterEvent", "BindableEvent") :: BindableEvent
local cancelEvent = ensure("CancelEncounterEvent", "BindableEvent") :: BindableEvent
local stateEvent = ensure("EncounterStateChanged", "BindableEvent") :: BindableEvent
local query = ensure("QueryEncounterState", "BindableFunction") :: BindableFunction
ensure("PublicNpcBubble", "RemoteEvent")

type State = {
	stage: string,
	revision: number,
	sequence: number,
	activeConversation: string,
	histories: { mati: { MissionContent.ChatMessage }, scamerino: { MissionContent.ChatMessage } },
	lastActionTime: number,
}
local states: { [Player]: State } = {}
local function stateFor(player: Player): State
	local existing = states[player]
	if existing then
		return existing
	end
	local state: State = {
		stage = "start",
		revision = 0,
		sequence = 0,
		activeConversation = "none",
		histories = { mati = {}, scamerino = {} },
		lastActionTime = 0,
	}
	states[player] = state
	return state
end
local function send(player: Player, state: State)
	if not player.Parent then
		return
	end
	state.sequence += 1
	local snapshot: MissionContent.MissionSnapshot = {
		revision = state.revision,
		sequence = state.sequence,
		activeConversation = state.activeConversation,
		histories = state.histories,
		choices = if state.stage == "decision" then MissionContent.choices else {},
		status = state.stage,
		title = if state.activeConversation == "scamerino" then "Scamerino" else "MatiBuilds",
		interlocutorName = if state.activeConversation == "scamerino" then "Scamerino" else "MatiBuilds",
	}
	update:FireClient(player, snapshot)
end
local function setStage(player: Player, state: State, stage: string)
	state.stage = stage
	stateEvent:Fire(player, state.revision, stage)
end
local function current(player: Player, state: State, revision: number): boolean
	return player.Parent == Players and states[player] == state and state.revision == revision
end
local function append(state: State, sender: string, text: string)
	table.insert(state.histories.mati, { sender = sender, text = text, time = os.clock() })
end
local function cancel(player: Player)
	local state = states[player]
	if state then
		state.revision += 1
		state.activeConversation = "none"
		setStage(player, state, "closed")
		send(player, state)
	end
	arbiter.releaseOwner(player)
end
query.OnInvoke = function(player: Player)
	local state = stateFor(player)
	return { stage = state.stage, revision = state.revision }
end
beginEvent.Event:Connect(function(player: Player)
	if not arbiter.isOwner(player) then
		return
	end
	local state = stateFor(player)
	if state.stage ~= "start" and state.stage ~= "closed" then
		return
	end
	state.revision += 1
	local revision = state.revision
	local token = arbiter.getToken(player)
	if token then
		token.revision = revision
	end
	state.activeConversation = "mati"
	state.histories = { mati = {}, scamerino = {} }
	setStage(player, state, "presenting")
	send(player, state)
	task.spawn(function()
		for index, message in MissionContent.initialMatiMessages do
			task.wait(if index == 1 then 0.55 else 1.25)
			if not current(player, state, revision) or not arbiter.isOwner(player) or state.stage ~= "presenting" then
				return
			end
			append(state, message.sender, message.text)
			send(player, state)
		end
		if not current(player, state, revision) or not arbiter.isOwner(player) then
			return
		end
		setStage(player, state, "decision")
		send(player, state)
	end)
end)
cancelEvent.Event:Connect(cancel)

request.OnServerEvent:Connect(function(player: Player, action: any, revision: any)
	if typeof(action) ~= "string" then
		return
	end
	local state = stateFor(player)
	if action == "ready" then
		send(player, state)
		return
	end
	if typeof(revision) ~= "number" or revision ~= state.revision then
		return
	end
	local now = os.clock()
	if now - state.lastActionTime < 0.25 then
		return
	end
	state.lastActionTime = now
	if action == "close" then
		cancel(player)
		return
	end
	if action == "replay" then
		if state.stage ~= "ending_good" and state.stage ~= "ending_bad" then
			return
		end
		state.revision += 1
		state.histories = { mati = {}, scamerino = {} }
		state.activeConversation = "none"
		arbiter.cancelPlayer(player)
		setStage(player, state, "start")
		local spawn = workspace:FindFirstChild("MissionStart")
		if spawn and spawn:IsA("BasePart") and player.Character then
			player.Character:PivotTo(spawn.CFrame + Vector3.new(0, 3, 0))
		end
		send(player, state)
		return
	end
	if state.stage ~= "decision" or not arbiter.isOwner(player) then
		return
	end
	local choice = MissionContent.getChoice(action)
	if not choice or not choice.enabled then
		return
	end
	append(state, "Ty", choice.label)
	setStage(player, state, "responding")
	send(player, state)
	local capturedRevision = state.revision
	task.spawn(function()
		task.wait(0.85)
		if not current(player, state, capturedRevision) or state.stage ~= "responding" then
			return
		end
		append(
			state,
			"MatiBuilds",
			if choice.nextStage == "ending_bad" then "Dobra, już wchodzę na konto." else "No dobra, twoja sprawa."
		)
		send(player, state)
		task.wait(0.85)
		if not current(player, state, capturedRevision) or state.stage ~= "responding" then
			return
		end
		append(state, "System", MissionContent.texts[choice.nextStage])
		setStage(player, state, choice.nextStage)
		arbiter.releaseOwner(player)
		send(player, state)
	end)
end)
local function hookPlayer(player: Player)
	player.CharacterRemoving:Connect(function()
		cancel(player)
	end)
end
Players.PlayerAdded:Connect(hookPlayer)
for _, player in Players:GetPlayers() do
	hookPlayer(player)
end
Players.PlayerRemoving:Connect(function(player)
	arbiter.cancelPlayer(player)
	states[player] = nil
end)
