--!strict
export type ChoiceRecord = {
	id: string,
	label: string,
	nextStage: string,
	enabled: boolean,
}

local MissionContent = {}

MissionContent.texts = {
	offer_intro = "MatiBuilds: Siemka! Masz super skin, widać że znasz się na grze :)\n"
		.. "MatiBuilds: Słuchaj, moja grupa robi dzisiaj rozdanie 1500 Robuxów dla aktywnych graczy i wylosowałem ciebie!\n"
		.. "MatiBuilds: Żeby przelać Robuxy przez system wypłat grupy, muszę się na chwilę zalogować na twoje konto i zatwierdzić transfer.\n"
		.. "MatiBuilds: Spokojnie, nic nie zmienię, a hasło zmienisz sobie od razu jak skończę. Podasz mi szybko login i hasło?",
	decision = "Co odpowiadasz?",
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
		label = "Jasne, podam hasło – doładuj mi Robuxy!",
		nextStage = "ending_bad",
		enabled = true,
	},
	{
		id = "refuse",
		label = "Nie ma opcji, nikomu nie podaję hasła do konta.",
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
