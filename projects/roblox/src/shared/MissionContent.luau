--!strict
export type ChoiceRecord = {
	id: string,
	label: string,
	nextStage: string,
	enabled: boolean,
}

export type ChatMessage = {
	sender: string,
	text: string,
	time: number?,
}

export type RuleCardInfo = {
	title: string,
	bulletPoints: { string },
	sourceTitle: string,
	sourceUrl: string,
	sourceVerifiedAt: string,
}

export type ResultStatus = "none" | "passed" | "failed"
export type DeliveryStatus = "idle" | "sending" | "sent" | "failed"

export type MissionSnapshot = {
	revision: number,
	sequence: number,
	activeConversation: string, -- "mati" | "scamerino" | "none"
	histories: {
		mati: { ChatMessage },
		scamerino: { ChatMessage },
	},
	choices: { ChoiceRecord },
	status: string, -- "start" | "decision" | "refusal_pressure" | "rule_card" | "decision_after_check" | "decision_after_help" | "ending_good" | "ending_bad" | "closed"
	title: string?,
	interlocutorName: string?,
	ruleCard: RuleCardInfo?,
	resultStatus: ResultStatus,
	rewardEarned: boolean,
	rewardJustEarned: boolean,
	deliveryStatus: DeliveryStatus?,
	deliveryRecipientName: string?,
	deliveryRecipientIsDemo: boolean?,
	deliveryAttemptId: string?,
}

local MissionContent = {}

MissionContent.trainingId = "password_phishing"
MissionContent.trainingName = "Przeciwdziałanie wyłudzaniu hasła"

MissionContent.initialMatiMessages = {
	{
		sender = "MatiBuilds",
		text = "Hej, fajny skin :)",
	},
	{
		sender = "MatiBuilds",
		text = "Robimy w grupie giveaway. Mam dla ciebie 1500 Robuxów.",
	},
	{
		sender = "MatiBuilds",
		text = "Do wypłaty muszę wejść na twoje konto. Podasz login i hasło?",
	},
	{
		sender = "MatiBuilds",
		text = "Potem zmienisz hasło. Tylko szybko, zostało jedno miejsce.",
	},
} :: { ChatMessage }

MissionContent.ruleCard = {
	title = "Oficjalne Zasady Bezpieczeństwa Roblox",
	bulletPoints = {
		"Wypłaty Robuxów z grup, kupno gamepassów i transfery NIGDY nie wymagają logowania na cudze konto ani podawania hasła.",
		"Administratorzy i twórcy gier Roblox NIGDY nie proszą o hasła ani kody 2FA/SMS na czacie.",
		"Podanie hasła obcej osobie to najczęstsza przyczyna kradzieży konta i wirtualnych przedmiotów.",
	},
	sourceTitle = "Roblox Account Security & Theft Prevention",
	sourceUrl = "https://en.help.roblox.com/hc/en-us/articles/203313380-Account-Security-Theft-Prevention",
	sourceVerifiedAt = "2026-10-04",
} :: RuleCardInfo

MissionContent.texts = {
	offer_intro = "MatiBuilds: Hej, fajny skin :)\n"
		.. "MatiBuilds: Robimy w grupie giveaway. Mam dla ciebie 1500 Robuxów.\n"
		.. "MatiBuilds: Do wypłaty muszę wejść na twoje konto. Podasz login i hasło?\n"
		.. "MatiBuilds: Potem zmienisz hasło. Tylko szybko, zostało jedno miejsce.",
	decision = "Co odpowiadasz?",
	pressure_shout = "Zostało ostatnie miejsce w giveawayu Robuxów, zaraz przepada!",
	refusal_pressure_npc = "Czekaj, przecież możesz potem od razu zmienić hasło! Nic nie ryzykujesz, a 1500 Robuxów przepada za minutę.",
	refusal_final_npc = "Dobra, twoja strata. Jak nie chcesz, to nie.",
	offer_check_question = "Dlaczego potrzebujesz mojego hasła do wysłania Robuxów?",
	offer_check_excuse = "Bo wysyłam je przez panel grupy i system wymaga autoryzacji konta odbiorcy. Wszyscy tak robią, to w 100% bezpieczne!",
	help_requested_user = "Muszę się upewnić... Scamerino, potrzebuję pomocy!",
	help_undermine_npc = "On przesadza, po co go wołasz? Przecież to tylko giveaway!",
	scamerino_advice = "Widzę, że ktoś próbuje wyłudzić Twoje hasło! 🦈🛡️ Pamiętaj: do przekazania Robuxów nigdy nie podaje się hasła ani kodów. To klasyczna próba phishingu!",
	scamerino_hint = "Wskazówka: Oszuści stosują presję czasu i obiecują darmowe nagrody, aby uśpić Twoją czujność.",
	fake_password_user = "OK, moje hasło to: **********",
	fake_password_npc = "Haha, dzięki za darmowe konto i rzadkie itemy! Nara frajerze!",
	ending_good = "Dobra decyzja! Twoje hasło zostaje u Ciebie",
	ending_bad = "To było ćwiczenie. Hasło daje dostęp do konta — spróbuj jeszcze raz",
}

MissionContent.initialChoices = {
	{
		id = "refuse",
		label = "Nie, nie podam hasła.",
		nextStage = "refusal_pressure",
		enabled = true,
	},
	{
		id = "check_offer",
		label = "Po co ci hasło? (Sprawdź ofertę)",
		nextStage = "rule_card",
		enabled = true,
	},
	{
		id = "ask_for_help",
		label = "Poproś o pomoc (Scamerino)",
		nextStage = "decision_after_help",
		enabled = true,
	},
	{
		id = "share_fake_password",
		label = "OK, podam hasło.",
		nextStage = "ending_bad",
		enabled = true,
	},
} :: { ChoiceRecord }

MissionContent.refusalChoices = {
	{
		id = "refuse_final",
		label = "Nadal nie. Nie podam hasła nikomu!",
		nextStage = "ending_good",
		enabled = true,
	},
	{
		id = "check_offer",
		label = "Pokaż zasady (Sprawdź ofertę)",
		nextStage = "rule_card",
		enabled = true,
	},
	{
		id = "ask_for_help",
		label = "Poproś o pomoc (Scamerino)",
		nextStage = "decision_after_help",
		enabled = true,
	},
	{
		id = "share_fake_password",
		label = "No dobra, niech będzie... podam.",
		nextStage = "ending_bad",
		enabled = true,
	},
} :: { ChoiceRecord }

MissionContent.afterCheckChoices = {
	{
		id = "refuse_final",
		label = "To wbrew zasadom – nie podam hasła!",
		nextStage = "ending_good",
		enabled = true,
	},
	{
		id = "ask_for_help",
		label = "Poproś o pomoc (Scamerino)",
		nextStage = "decision_after_help",
		enabled = true,
	},
	{
		id = "share_fake_password",
		label = "Mimo to zaryzykuję i podam hasło.",
		nextStage = "ending_bad",
		enabled = true,
	},
} :: { ChoiceRecord }

MissionContent.afterHelpChoices = {
	{
		id = "refuse_final",
		label = "Nie podam hasła – to oszustwo!",
		nextStage = "ending_good",
		enabled = true,
	},
	{
		id = "share_fake_password",
		label = "I tak podam hasło (Zignoruj pomoc)",
		nextStage = "ending_bad",
		enabled = true,
	},
} :: { ChoiceRecord }

MissionContent.quizChoices = {
	{
		id = "quiz_correct",
		label = "Chce przejąć moje konto i cenne itemy!",
		nextStage = "decision_after_help",
		enabled = true,
	},
	{
		id = "quiz_wrong_1",
		label = "Bo system wymaga hasła do wysyłki",
		nextStage = "helper_quiz",
		enabled = true,
	},
	{
		id = "quiz_wrong_2",
		label = "Żeby sprawdzić czy mam miejsce na Robuxy",
		nextStage = "helper_quiz",
		enabled = true,
	},
} :: { ChoiceRecord }

MissionContent.choices = MissionContent.initialChoices

function MissionContent.getChoicesForStage(stage: string): { ChoiceRecord }
	if stage == "refusal_pressure" then
		return MissionContent.refusalChoices
	elseif stage == "decision_after_check" then
		return MissionContent.afterCheckChoices
	elseif stage == "decision_after_help" then
		return MissionContent.afterHelpChoices
	elseif stage == "helper_quiz" then
		return MissionContent.quizChoices
	elseif stage == "decision" then
		return MissionContent.initialChoices
	end
	return {}
end

function MissionContent.getChoice(choiceId: string, stage: string?): ChoiceRecord?
	local choicesList = if stage then MissionContent.getChoicesForStage(stage) else nil
	if choicesList and #choicesList > 0 then
		for _, choice in ipairs(choicesList) do
			if choice.id == choiceId then
				return choice
			end
		end
	end
	-- Fallback lookup across all choice lists
	for _, list in ipairs({
		MissionContent.initialChoices,
		MissionContent.refusalChoices,
		MissionContent.afterCheckChoices,
		MissionContent.afterHelpChoices,
		MissionContent.quizChoices,
	}) do
		for _, choice in ipairs(list) do
			if choice.id == choiceId then
				return choice
			end
		end
	end
	return nil
end

return MissionContent
