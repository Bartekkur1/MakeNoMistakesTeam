--!strict
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MissionContent = require(ReplicatedStorage:WaitForChild("MissionContent") :: ModuleScript)
local NPCNavigation = require(script.Parent:WaitForChild("NPCNavigation") :: ModuleScript)
local ScamerinoNPCManager = require(script.Parent:WaitForChild("ScamerinoNPCManager") :: ModuleScript)
local RewardManager = require(script.Parent:WaitForChild("RewardManager") :: ModuleScript)
local ReportExportConfig = require(script.Parent:WaitForChild("ReportExportConfig") :: ModuleScript)
local ReportExportService = require(script.Parent:WaitForChild("ReportExportService") :: ModuleScript)
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
local publicBubble = ensure("PublicNpcBubble", "RemoteEvent") :: RemoteEvent

type State = {
	stage: string,
	revision: number,
	sequence: number,
	activeConversation: string,
	histories: { mati: { MissionContent.ChatMessage }, scamerino: { MissionContent.ChatMessage } },
	lastActionTime: number,
	refusalCount: number,
	helpReceived: boolean,
	quizAttempts: number,
	resultStatus: MissionContent.ResultStatus,
	rewardJustEarned: boolean,
	deliveryStatus: MissionContent.DeliveryStatus?,
	deliveryRecipientName: string?,
	deliveryRecipientIsDemo: boolean?,
	deliveryAttemptId: string?,
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
		refusalCount = 0,
		helpReceived = false,
		quizAttempts = 0,
		resultStatus = "none",
		rewardJustEarned = false,
		deliveryStatus = "idle",
		deliveryRecipientName = nil,
		deliveryRecipientIsDemo = nil,
		deliveryAttemptId = nil,
	}
	states[player] = state
	return state
end

local function send(player: Player, state: State)
	if not player.Parent then
		return
	end
	state.sequence += 1
	local isDecisionStage = state.stage == "decision"
		or state.stage == "refusal_pressure"
		or state.stage == "decision_after_check"
		or state.stage == "decision_after_help"
		or state.stage == "helper_quiz"
	local choices = if isDecisionStage then MissionContent.getChoicesForStage(state.stage) else {}
	local snapshot: MissionContent.MissionSnapshot = {
		revision = state.revision,
		sequence = state.sequence,
		activeConversation = state.activeConversation,
		histories = state.histories,
		choices = choices,
		status = state.stage,
		resultStatus = state.resultStatus,
		rewardEarned = RewardManager.hasEarned(player),
		rewardJustEarned = state.rewardJustEarned,
		deliveryStatus = state.deliveryStatus,
		deliveryRecipientName = state.deliveryRecipientName,
		deliveryRecipientIsDemo = state.deliveryRecipientIsDemo,
		deliveryAttemptId = state.deliveryAttemptId,
		title = if state.activeConversation == "scamerino" then "Scamerino" else "MatiBuilds",
		interlocutorName = if state.activeConversation == "scamerino" then "Scamerino" else "MatiBuilds",
		ruleCard = if state.stage == "rule_card" then MissionContent.ruleCard else nil,
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

local function appendMati(state: State, sender: string, text: string)
	table.insert(state.histories.mati, { sender = sender, text = text, time = os.clock() })
end

local function appendScamerino(state: State, sender: string, text: string)
	table.insert(state.histories.scamerino, { sender = sender, text = text, time = os.clock() })
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
	ScamerinoNPCManager.cancelPlayer(player)
end

local function getMatiHead(): BasePart?
	local lobby = workspace:FindFirstChild("MarketplaceLobby")
	local scammer = lobby and lobby:FindFirstChild("ScammerNPC")
	local head = scammer and scammer:FindFirstChild("Head")
	if head and head:IsA("BasePart") then
		return head
	end
	return nil
end

local function dispatchReportExport(player: Player, state: State, outcome: string)
	local config = ReportExportConfig.load()
	if not config then
		state.deliveryStatus = "failed"
		return
	end

	local attemptId = HttpService:GenerateGUID(false):lower()
	state.deliveryStatus = "sending"
	state.deliveryAttemptId = attemptId
	state.deliveryRecipientName = nil
	state.deliveryRecipientIsDemo = nil

	local hintsUsed = if state.helpReceived then 1 else 0
	local contentText = if outcome == "safe_refusal"
		then "Bezpieczna odmowa podania hasła w grze edukacyjnej."
		else "Fikcyjne podanie hasła w grze edukacyjnej. Hasło wymaga natychmiastowej zmiany."

	local payload: ReportExportService.ReportExportPayload = {
		attempt_id = attemptId,
		roblox_username = player.Name,
		roblox_user_id = player.UserId,
		attack_type = "data_request",
		source = "game",
		taken_actions = {},
		content = contentText,
		hints_used = hintsUsed,
		outcome = outcome,
		training_id = MissionContent.trainingId,
		training_name = MissionContent.trainingName,
	}

	local capturedRevision = state.revision

	task.spawn(function()
		ReportExportService.exportAttemptAsync(payload, config, function(status, ack)
			if not current(player, state, capturedRevision) or state.deliveryAttemptId ~= attemptId then
				return
			end
			state.deliveryStatus = status
			if ack then
				state.deliveryRecipientName = ack.parent_name
				state.deliveryRecipientIsDemo = not ack.matched
			end
			send(player, state)
		end)
	end)
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
	state.refusalCount = 0
	state.helpReceived = false
	state.quizAttempts = 0
	state.resultStatus = "none"
	state.rewardJustEarned = false
	setStage(player, state, "presenting")
	send(player, state)
	task.spawn(function()
		for index, message in MissionContent.initialMatiMessages do
			task.wait(if index == 1 then 0.55 else 1.25)
			if not current(player, state, revision) or not arbiter.isOwner(player) or state.stage ~= "presenting" then
				return
			end
			appendMati(state, message.sender, message.text)
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

	if action == "close_rule_card" then
		if state.stage ~= "rule_card" or not arbiter.isOwner(player) then
			return
		end
		setStage(player, state, "decision_after_check")
		send(player, state)
		return
	end

	if action == "switch_to_mati" then
		state.activeConversation = "mati"
		send(player, state)
		return
	elseif action == "switch_to_scamerino" then
		state.activeConversation = "scamerino"
		send(player, state)
		return
	end

	if action == "replay" then
		if state.stage ~= "ending_good" and state.stage ~= "ending_bad" then
			return
		end
		state.revision += 1
		state.histories = { mati = {}, scamerino = {} }
		state.activeConversation = "none"
		state.refusalCount = 0
		state.helpReceived = false
		state.quizAttempts = 0
		state.resultStatus = "none"
		state.rewardJustEarned = false
		state.deliveryStatus = "idle"
		state.deliveryRecipientName = nil
		state.deliveryRecipientIsDemo = nil
		state.deliveryAttemptId = nil
		arbiter.cancelPlayer(player)
		ScamerinoNPCManager.resetForPlayer(player, state.revision)
		setStage(player, state, "start")
		local spawn = workspace:FindFirstChild("MissionStart")
		if spawn and spawn:IsA("BasePart") and player.Character then
			player.Character:PivotTo(spawn.CFrame + Vector3.new(0, 3, 0))
		end
		send(player, state)
		return
	end

	local isDecisionStage = state.stage == "decision"
		or state.stage == "refusal_pressure"
		or state.stage == "decision_after_check"
		or state.stage == "decision_after_help"
		or state.stage == "helper_quiz"
	if not isDecisionStage or not arbiter.isOwner(player) then
		return
	end

	local choice = MissionContent.getChoice(action, state.stage)
	if not choice or not choice.enabled then
		return
	end
	-- getChoice also supports a global lookup; it is not stage authorization.
	local allowed = false
	for _, stageChoice in MissionContent.getChoicesForStage(state.stage) do
		if stageChoice.id == action and stageChoice.enabled then
			allowed = true
			break
		end
	end
	if not allowed then
		return
	end

	local capturedRevision = state.revision

	-- Obsługa etapu quizu pomocnika
	if state.stage == "helper_quiz" then
		appendScamerino(state, "Ty", choice.label)
		setStage(player, state, "responding")
		send(player, state)

		task.spawn(function()
			task.wait(0.85)
			if not current(player, state, capturedRevision) or state.stage ~= "responding" then
				return
			end

			if choice.id == "quiz_correct" then
				appendScamerino(
					state,
					"Scamerino",
					"Brawo! Dokładnie tak. Oszuści obiecują darmowe nagrody i stosują presję czasu, aby wyłudzić hasło. Nigdy go nie podawaj!"
				)
				send(player, state)
				task.wait(1.0)
				if not current(player, state, capturedRevision) then
					return
				end
				appendScamerino(
					state,
					"Scamerino",
					"Wróć teraz do rozmowy z MatiBuilds i podejmij bezpieczną decyzję!"
				)
				setStage(player, state, "decision_after_help")
				send(player, state)
			else
				state.quizAttempts += 1
				if state.quizAttempts == 1 then
					appendScamerino(
						state,
						"Scamerino",
						"Nie do końca! Zastanów się: do przesłania Robuxów wystarczy sam nick. Po co mu Twoje hasło?"
					)
					setStage(player, state, "helper_quiz")
					send(player, state)
				else
					appendScamerino(
						state,
						"Scamerino",
						"Pamiętaj: NIKT uczciwy nie potrzebuje Twojego hasła do przelania Robuxów. Każda taka prośba to próba kradzieży konta!"
					)
					send(player, state)
					task.wait(1.0)
					if not current(player, state, capturedRevision) then
						return
					end
					appendScamerino(
						state,
						"Scamerino",
						"Wróć teraz do rozmowy z MatiBuilds i podejmij bezpieczną decyzję!"
					)
					setStage(player, state, "decision_after_help")
					send(player, state)
				end
			end
		end)
		return
	end

	if action == "refuse" then
		-- Pierwsza odmowa -> presja czasu
		state.refusalCount = 1
		appendMati(state, "Ty", choice.label)
		setStage(player, state, "responding")
		send(player, state)
		task.spawn(function()
			task.wait(0.85)
			if not current(player, state, capturedRevision) or state.stage ~= "responding" then
				return
			end
			appendMati(state, "MatiBuilds", MissionContent.texts.refusal_pressure_npc)
			setStage(player, state, "refusal_pressure")
			send(player, state)
		end)
	elseif action == "refuse_final" then
		-- Druga / ostateczna odmowa -> dobre zakończenie
		state.refusalCount += 1
		appendMati(state, "Ty", choice.label)
		setStage(player, state, "responding")
		send(player, state)
		task.spawn(function()
			task.wait(0.85)
			if not current(player, state, capturedRevision) or state.stage ~= "responding" then
				return
			end
			appendMati(state, "MatiBuilds", MissionContent.texts.refusal_final_npc)
			send(player, state)
			task.wait(0.85)
			if not current(player, state, capturedRevision) or state.stage ~= "responding" then
				return
			end
			appendMati(state, "System", MissionContent.texts.ending_good)
			if state.helpReceived then
				ScamerinoNPCManager.setOutcome(player, "safe")
				appendScamerino(
					state,
					"Scamerino",
					"Świetnie! Hasło zostało u Ciebie, a konto jest bezpieczne. Dobra robota! 🦈🛡️"
				)
			end
			state.resultStatus = "passed"
			state.rewardJustEarned = RewardManager.grantShield(player)
			setStage(player, state, "ending_good")
			arbiter.releaseOwner(player)
			dispatchReportExport(player, state, "safe_refusal")
			send(player, state)
		end)
	elseif action == "check_offer" then
		-- Sprawdzenie oferty -> dopytanie, wymówka i karta zasad
		appendMati(state, "Ty", choice.label)
		setStage(player, state, "responding")
		send(player, state)
		task.spawn(function()
			task.wait(0.85)
			if not current(player, state, capturedRevision) or state.stage ~= "responding" then
				return
			end
			appendMati(state, "MatiBuilds", MissionContent.texts.offer_check_excuse)
			send(player, state)
			task.wait(0.85)
			if not current(player, state, capturedRevision) or state.stage ~= "responding" then
				return
			end
			appendMati(state, "System", "Sprawdzasz oficjalne zasady bezpieczeństwa Roblox...")
			setStage(player, state, "rule_card")
			send(player, state)
		end)
	elseif action == "ask_for_help" then
		-- Wezwanie pomocy -> Scamerino podchodzi fizycznie, dymek scammera, otwarcie helper_quiz
		appendMati(state, "Ty", choice.label)
		setStage(player, state, "waiting_for_helper")
		send(player, state)

		local head = getMatiHead()
		if head then
			publicBubble:FireAllClients(head, MissionContent.texts.help_undermine_npc)
		end

		appendMati(state, "MatiBuilds", MissionContent.texts.help_undermine_npc)
		send(player, state)

		ScamerinoNPCManager.requestHelp(player, state.revision, function(res)
			if not current(player, state, capturedRevision) then
				return
			end

			if res == "arrived" then
				state.helpReceived = true
				state.activeConversation = "scamerino"
				appendScamerino(
					state,
					"Scamerino",
					"Widzę, że ktoś próbuje wyłudzić Twoje hasło! 🦈🛡️ Zastanów się: do przekazania Robuxów nie potrzeba hasła. Dlaczego on o nie prosi?"
				)
				setStage(player, state, "helper_quiz")
				send(player, state)
			else
				-- no_path lub timeout
				state.helpReceived = false
				appendMati(
					state,
					"System",
					"Scamerino nie mógł dotrzeć na czas. Pamiętaj: nigdy nie podawaj nikomu hasła ani kodów!"
				)
				setStage(player, state, "decision_after_check")
				send(player, state)
			end
		end)
	elseif action == "share_fake_password" then
		-- Fikcyjne podanie hasła -> zła decyzja i symulacja przejęcia konta
		appendMati(state, "Ty", choice.label)
		setStage(player, state, "responding")
		send(player, state)
		task.spawn(function()
			task.wait(0.85)
			if not current(player, state, capturedRevision) or state.stage ~= "responding" then
				return
			end
			appendMati(state, "MatiBuilds", MissionContent.texts.fake_password_npc)
			send(player, state)
			task.wait(0.85)
			if not current(player, state, capturedRevision) or state.stage ~= "responding" then
				return
			end
			appendMati(state, "System", MissionContent.texts.ending_bad)
			if state.helpReceived then
				ScamerinoNPCManager.setOutcome(player, "alarm")
				appendScamerino(
					state,
					"Scamerino",
					"Stop! Hasło daje pełny dostęp do konta. To było ćwiczenie — spróbuj jeszcze raz!"
				)
			end
			state.resultStatus = "failed"
			state.rewardJustEarned = false
			setStage(player, state, "ending_bad")
			arbiter.releaseOwner(player)
			dispatchReportExport(player, state, "compromised_password")
			send(player, state)
		end)
	end
end)

local function hookPlayer(player: Player)
	player.CharacterAdded:Connect(function(character: Model)
		RewardManager.restoreShield(player, character)
	end)
	-- Avatar appearance loading can replace accessories after CharacterAdded.
	player.CharacterAppearanceLoaded:Connect(function(character: Model)
		RewardManager.restoreShield(player, character)
	end)
	if player.Character then
		task.spawn(RewardManager.restoreShield, player, player.Character)
	end
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
	ScamerinoNPCManager.cancelPlayer(player)
	RewardManager.forgetPlayer(player)
	states[player] = nil
end)
