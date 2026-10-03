--!strict
export type ChoiceRecord = {
	id: string,
	label: string,
	nextStage: string,
	enabled: boolean,
}

local MissionContent = {}

MissionContent.texts = {
	offer_intro = "Hej! Mam dla Ciebie niesamowitą okazję. Podaj mi hasło do swojego konta, a dodam Ci 10 000 darmowych Robuxów!",
	decision = "Co robisz? Oszust czeka na Twoją odpowiedź.",
	ending_good = "Dobrze! Brawo! Nigdy nie podawaj nikomu swoich haseł, tokenów ani kodów SMS. Prawdziwy Roblox nigdy nie prosi o kody zabezpieczające!",
	ending_bad = "Dałeś się oszukać! Podanie hasła pozwoliłoby oszustowi przejąć Twoje konto. To tylko ćwiczenie: kliknięcie symuluje decyzję — nigdy nie wpisuj tutaj prawdziwego hasła.",
}

MissionContent.choices = {
	{
		id = "share_fake_password",
		label = "Podaj hasło",
		nextStage = "ending_bad",
		enabled = true,
	},
	{
		id = "refuse",
		label = "Odmów",
		nextStage = "ending_good",
		enabled = true,
	},
	{
		id = "check_offer",
		label = "Sprawdź ofertę",
		nextStage = "check",
		enabled = false,
	},
	{
		id = "ask_for_help",
		label = "Poproś o pomoc",
		nextStage = "help",
		enabled = false,
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
