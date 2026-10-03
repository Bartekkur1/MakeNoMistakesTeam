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

export type MissionSnapshot = {
	revision: number,
	sequence: number,
	activeConversation: string, -- "mati" | "scamerino" | "none"
	histories: {
		mati: { ChatMessage },
		scamerino: { ChatMessage },
	},
	choices: { ChoiceRecord },
	status: string, -- "start" | "decision" | "ending_good" | "ending_bad" | "closed"
	title: string?,
	interlocutorName: string?,
}

local MissionContent = {}

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

MissionContent.texts = {
	offer_intro = "MatiBuilds: Hej, fajny skin :)\n"
		.. "MatiBuilds: Robimy w grupie giveaway. Mam dla ciebie 1500 Robuxów.\n"
		.. "MatiBuilds: Do wypłaty muszę wejść na twoje konto. Podasz login i hasło?\n"
		.. "MatiBuilds: Potem zmienisz hasło. Tylko szybko, zostało jedno miejsce.",
	decision = "Co odpowiadasz?",
	pressure_shout = "Zostało ostatnie miejsce w giveawayu Robuxów, zaraz przepada!",
	ending_good = "Brawo! Twoje konto i przedmioty są całkowicie bezpieczne.\n\n"
		.. "Oszuści w Robloxie często obiecują darmowe Robuxy i twierdzą, że „muszą się zalogować, żeby je przelać”. Zapamiętaj: nikt uczciwy (nawet administrator ani twórca gry) nie potrzebuje Twojego hasła.\n\n"
		.. "W prawdziwej grze w takiej sytuacji: nie podawaj żadnych danych, zgłoś gracza przez menu Roblox [Report Abuse] i powiedz o rozmowie zaufanemu dorosłemu.",
	ending_bad = "Uważaj! Twoje konto i wirtualne przedmioty zostały przejęte!\n\n"
		.. "Gdy podasz hasło obcej osobie, oszust natychmiast zmienia dane logowania, kradnie Twoje rzadkie skiny i odcina Cię od konta. W Robloxie transfer Robuxów nigdy nie wymaga logowania się na konto odbiorcy.\n\n"
		.. "To było tylko bezpieczne ćwiczenie. Jeśli podobna sytuacja przydarzy Ci się naprawdę: natychmiast powiedz rodzicom lub zaufanemu dorosłemu, aby pomogli Ci odzyskać konto przez pomoc techniczną Roblox.",
}

MissionContent.choices = {
	{
		id = "share_fake_password",
		label = "OK, podam hasło.",
		nextStage = "ending_bad",
		enabled = true,
	},
	{
		id = "refuse",
		label = "Nie, nie podam hasła.",
		nextStage = "ending_good",
		enabled = true,
	},
} :: { ChoiceRecord }

function MissionContent.getChoice(choiceId: string): ChoiceRecord?
	for _, choice in ipairs(MissionContent.choices) do
		if choice.id == choiceId then
			return choice
		end
	end
	return nil
end

return MissionContent
