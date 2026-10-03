--!strict
--[=[
    ScamerinoDialogueController
    Obsługa okna dialogowego Scamerino Alertinio zgodnie z wytycznymi Roblox UX/UI:
    - Lower-Third layout (dolna 1/3 ekranu, nie zasłania postaci gracza i NPC)
    - Responsywne kotwiczenie: AnchorPoint = (0.5, 1), Position = (0.5, 0, 1, -20)
    - Ograniczenie rozmiaru (UISizeConstraint): max 840x240px
    - Touch Targets: min 44px wysokości na przyciskach dla urządzeń dotykowych
    - Płynne animacje wysuwania TweenService
]=]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")
local ProximityPromptService = game:GetService("ProximityPromptService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui") :: PlayerGui
local dialogueEvent = ReplicatedStorage:FindFirstChild("ScamerinoDialogueEvent") :: RemoteEvent?
if not dialogueEvent then
	dialogueEvent = Instance.new("RemoteEvent")
	dialogueEvent.Name = "ScamerinoDialogueEvent"
	dialogueEvent.Parent = ReplicatedStorage
end
local remoteEvent: RemoteEvent = dialogueEvent :: RemoteEvent

-- Utwórz lub pobierz ScreenGui
local screenGui = playerGui:FindFirstChild("ScamerinoDialogueGui") :: ScreenGui?
if not screenGui then
	screenGui = Instance.new("ScreenGui")
	screenGui.Name = "ScamerinoDialogueGui"
	screenGui.ResetOnSpawn = false
	screenGui.IgnoreGuiInset = true
	screenGui.Parent = playerGui
else
	-- Usuń ewentualne stare elementy interfejsu
	local oldMain = screenGui:FindFirstChild("MainFrame")
	if oldMain then
		oldMain:Destroy()
	end
end

-- Główny kontener dialogowy (Lower-Third Bar)
local mainFrame = Instance.new("Frame")
mainFrame.Name = "MainFrame"
mainFrame.Size = UDim2.fromScale(0.92, 0.30)
mainFrame.Position = UDim2.fromScale(0.5, 1.4) -- Pozycja początkowa (ukryta pod dolną krawędzią)
mainFrame.AnchorPoint = Vector2.new(0.5, 1)
mainFrame.BackgroundColor3 = Color3.fromRGB(10, 20, 42)
mainFrame.BackgroundTransparency = 0.06
mainFrame.BorderSizePixel = 0
mainFrame.Visible = false
mainFrame.Parent = screenGui

local sizeConstraint = Instance.new("UISizeConstraint")
sizeConstraint.MaxSize = Vector2.new(840, 240)
sizeConstraint.MinSize = Vector2.new(340, 180)
sizeConstraint.Parent = mainFrame

local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 16)
corner.Parent = mainFrame

local stroke = Instance.new("UIStroke")
stroke.Color = Color3.fromRGB(255, 195, 30)
stroke.Thickness = 2.5
stroke.Parent = mainFrame

local grad = Instance.new("UIGradient")
grad.Color = ColorSequence.new({
	ColorSequenceKeypoint.new(0, Color3.fromRGB(14, 30, 68)),
	ColorSequenceKeypoint.new(1, Color3.fromRGB(8, 16, 36)),
})
grad.Rotation = 45
grad.Parent = mainFrame

-- Pasek nagłówka (Header)
local header = Instance.new("Frame")
header.Name = "Header"
header.Size = UDim2.new(1, 0, 0, 36)
header.BackgroundColor3 = Color3.fromRGB(8, 18, 40)
header.BorderSizePixel = 0
header.Parent = mainFrame

local hCorner = Instance.new("UICorner")
hCorner.CornerRadius = UDim.new(0, 16)
hCorner.Parent = header

local title = Instance.new("TextLabel")
title.Name = "Title"
title.Size = UDim2.new(1, -50, 1, 0)
title.Position = UDim2.fromOffset(14, 0)
title.BackgroundTransparency = 1
title.Font = Enum.Font.FredokaOne
title.Text = "🦈 SCAMERINO ALERTINIO | CYBER-POMOCNIK"
title.TextColor3 = Color3.fromRGB(255, 220, 60)
title.TextSize = 16
title.TextXAlignment = Enum.TextXAlignment.Left
title.Parent = header

local closeBtn = Instance.new("TextButton")
closeBtn.Name = "CloseBtn"
closeBtn.Size = UDim2.fromOffset(28, 28)
closeBtn.Position = UDim2.new(1, -34, 0.5, -14)
closeBtn.BackgroundColor3 = Color3.fromRGB(200, 45, 55)
closeBtn.Text = "✕"
closeBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
closeBtn.Font = Enum.Font.FredokaOne
closeBtn.TextSize = 16
closeBtn.AutoButtonColor = true
closeBtn.Parent = header

local cBtnCorner = Instance.new("UICorner")
cBtnCorner.CornerRadius = UDim.new(0, 8)
cBtnCorner.Parent = closeBtn

-- Lewy panel (Avatar i status)
local leftArea = Instance.new("Frame")
leftArea.Name = "LeftArea"
leftArea.Size = UDim2.new(0, 120, 1, -44)
leftArea.Position = UDim2.fromOffset(10, 38)
leftArea.BackgroundColor3 = Color3.fromRGB(15, 32, 70)
leftArea.BackgroundTransparency = 0.4
leftArea.BorderSizePixel = 0
leftArea.Parent = mainFrame

local lCorner = Instance.new("UICorner")
lCorner.CornerRadius = UDim.new(0, 12)
lCorner.Parent = leftArea

local avatarIcon = Instance.new("TextLabel")
avatarIcon.Size = UDim2.new(1, 0, 0, 60)
avatarIcon.Position = UDim2.fromOffset(0, 8)
avatarIcon.BackgroundTransparency = 1
avatarIcon.Font = Enum.Font.FredokaOne
avatarIcon.Text = "🦈"
avatarIcon.TextSize = 48
avatarIcon.Parent = leftArea

local badgeLabel = Instance.new("TextLabel")
badgeLabel.Name = "BadgeLabel"
badgeLabel.Size = UDim2.new(0.9, 0, 0, 36)
badgeLabel.Position = UDim2.new(0.05, 0, 1, -42)
badgeLabel.BackgroundColor3 = Color3.fromRGB(255, 180, 20)
badgeLabel.Font = Enum.Font.FredokaOne
badgeLabel.Text = "STATUS: CZUWA\n🛡️ BEZPIECZNY"
badgeLabel.TextColor3 = Color3.fromRGB(10, 20, 45)
badgeLabel.TextSize = 10
badgeLabel.Parent = leftArea

local bCorner = Instance.new("UICorner")
bCorner.CornerRadius = UDim.new(0, 8)
bCorner.Parent = badgeLabel

-- Prawy panel (Tekst wypowiedzi i przyciski)
local rightArea = Instance.new("Frame")
rightArea.Name = "RightArea"
rightArea.Size = UDim2.new(1, -145, 1, -44)
rightArea.Position = UDim2.fromOffset(136, 38)
rightArea.BackgroundTransparency = 1
rightArea.Parent = mainFrame

local dialogBox = Instance.new("TextLabel")
dialogBox.Name = "DialogBox"
dialogBox.Size = UDim2.new(1, 0, 1, -54)
dialogBox.Position = UDim2.new(0, 0, 0, 0)
dialogBox.BackgroundColor3 = Color3.fromRGB(15, 30, 65)
dialogBox.BackgroundTransparency = 0.3
dialogBox.TextColor3 = Color3.fromRGB(240, 245, 255)
dialogBox.Font = Enum.Font.GothamMedium
dialogBox.TextSize = 13
dialogBox.TextWrapped = true
dialogBox.TextXAlignment = Enum.TextXAlignment.Left
dialogBox.TextYAlignment = Enum.TextYAlignment.Top
dialogBox.Parent = rightArea

local dCorner = Instance.new("UICorner")
dCorner.CornerRadius = UDim.new(0, 10)
dCorner.Parent = dialogBox

local dPadding = Instance.new("UIPadding")
dPadding.PaddingLeft = UDim.new(0, 12)
dPadding.PaddingRight = UDim.new(0, 12)
dPadding.PaddingTop = UDim.new(0, 8)
dPadding.PaddingBottom = UDim.new(0, 8)
dPadding.Parent = dialogBox

local buttonContainer = Instance.new("Frame")
buttonContainer.Name = "ButtonContainer"
buttonContainer.Size = UDim2.new(1, 0, 0, 46)
buttonContainer.Position = UDim2.new(0, 0, 1, -48)
buttonContainer.BackgroundTransparency = 1
buttonContainer.Parent = rightArea

local listLayout = Instance.new("UIListLayout")
listLayout.FillDirection = Enum.FillDirection.Horizontal
listLayout.HorizontalAlignment = Enum.HorizontalAlignment.Left
listLayout.VerticalAlignment = Enum.VerticalAlignment.Center
listLayout.Padding = UDim.new(0, 8)
listLayout.SortOrder = Enum.SortOrder.LayoutOrder
listLayout.Parent = buttonContainer

-- Helper do tworzenia przycisków wyboru (min 44px touch target)
local function createChoiceBtn(order: number, text: string, callback: () -> (), color: Color3?): TextButton
	local btn = Instance.new("TextButton")
	btn.Size = UDim2.fromOffset(155, 44) -- ergonomiczny cel dotykowy
	btn.BackgroundColor3 = color or Color3.fromRGB(22, 58, 128)
	btn.Font = Enum.Font.FredokaOne
	btn.Text = text
	btn.TextColor3 = Color3.fromRGB(255, 255, 255)
	btn.TextSize = 12
	btn.TextWrapped = true
	btn.LayoutOrder = order
	btn.AutoButtonColor = true
	btn.Parent = buttonContainer

	local btnCorner = Instance.new("UICorner")
	btnCorner.CornerRadius = UDim.new(0, 8)
	btnCorner.Parent = btn

	local btnStroke = Instance.new("UIStroke")
	btnStroke.Color = Color3.fromRGB(255, 255, 255)
	btnStroke.Thickness = 1
	btnStroke.Transparency = 0.7
	btnStroke.Parent = btn

	btn.MouseButton1Click:Connect(callback)
	return btn
end

local function clearButtons()
	for _, c in ipairs(buttonContainer:GetChildren()) do
		if c:IsA("TextButton") then
			c:Destroy()
		end
	end
end

local INTERACTION_DISTANCE = 14
local BREAK_DISTANCE = 18
local isDialogueOpen = false

local function getScamerinoRoot(): BasePart?
	local scamerino = workspace:FindFirstChild("ScamerinoAlertinio")
	if not scamerino then
		return nil
	end
	local hrp = scamerino:FindFirstChild("HumanoidRootPart")
	if hrp and hrp:IsA("BasePart") then
		return hrp
	end
	local torso = scamerino:FindFirstChild("Torso")
	if torso and torso:IsA("BasePart") then
		return torso
	end
	return nil
end

local function getPlayerRoot(): BasePart?
	local char = player.Character
	if not char then
		return nil
	end
	local hrp = char:FindFirstChild("HumanoidRootPart")
	if hrp and hrp:IsA("BasePart") then
		return hrp
	end
	return nil
end

local function getDistanceToScamerino(): number?
	local playerRoot = getPlayerRoot()
	local scamerinoRoot = getScamerinoRoot()
	if playerRoot and scamerinoRoot then
		return (playerRoot.Position - scamerinoRoot.Position).Magnitude
	end
	return nil
end

-- Animacja Otwórz/Zamknij
local function openUI()
	if isDialogueOpen then
		return
	end
	isDialogueOpen = true
	mainFrame.Visible = true
	mainFrame.Position = UDim2.fromScale(0.5, 1.4)
	local tw = TweenService:Create(
		mainFrame,
		TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out),
		{ Position = UDim2.new(0.5, 0, 1, -20) }
	)
	tw:Play()
end

local function closeUI()
	if not isDialogueOpen then
		return
	end
	isDialogueOpen = false
	local tw = TweenService:Create(
		mainFrame,
		TweenInfo.new(0.25, Enum.EasingStyle.Quad, Enum.EasingDirection.In),
		{ Position = UDim2.fromScale(0.5, 1.4) }
	)
	tw:Play()
	tw.Completed:Connect(function()
		if not isDialogueOpen then
			mainFrame.Visible = false
		end
	end)
end

closeBtn.MouseButton1Click:Connect(closeUI)

-- Dialogi
local showMainMenu: () -> ()
local showPhishingInfo: () -> ()
local showScamSigns: () -> ()
local showRules: () -> ()
local showReportAdvice: () -> ()

showMainMenu = function()
	clearButtons()
	badgeLabel.Text = "STATUS: CZUWA\n🛡️ BEZPIECZNY"
	badgeLabel.BackgroundColor3 = Color3.fromRGB(255, 180, 20)

	dialogBox.Text =
		"Cześć! Jestem Scamerino Alertinio – Twój Cyber-Pomocnik! 🦈🛡️\nPilnuję, aby nikt w Roblox nie wyłudził Twojego hasła, konta ani Robuxów.\nO czym chcesz dowiedzieć się więcej?"

	createChoiceBtn(1, "🔍 Czym jest Phishing?", function()
		showPhishingInfo()
	end, Color3.fromRGB(30, 100, 200))

	createChoiceBtn(2, "⚠️ Czerwone flagi oszusta", function()
		showScamSigns()
	end, Color3.fromRGB(180, 110, 20))

	createChoiceBtn(3, "🛡️ 3 Złote Zasady", function()
		showRules()
	end)

	createChoiceBtn(4, "🚨 Podejrzany gracz w lobby!", function()
		showReportAdvice()
	end, Color3.fromRGB(200, 60, 60))

	createChoiceBtn(5, "👋 Do widzenia", function()
		closeUI()
	end, Color3.fromRGB(60, 70, 90))
end

showPhishingInfo = function()
	clearButtons()
	dialogBox.Text =
		"🎣 CZYM JEST PHISHING? To zarzucenie 'przynęty' (np. darmowe Robuxy, rzadki pet, fałszywy link). Gdy ktoś obiecuje Robuxy w zamian za hasło lub kod SMS, chce przejąć konto! Nigdy nie wpisuj hasła w odpowiedzi na taką ofertę."

	createChoiceBtn(1, "⚠️ Jak rozpoznać oszusta?", function()
		showScamSigns()
	end, Color3.fromRGB(180, 110, 20))

	createChoiceBtn(2, "🛡️ Złote zasady", function()
		showRules()
	end)

	createChoiceBtn(3, "🔙 Wróć do menu", function()
		showMainMenu()
	end)
end

showScamSigns = function()
	clearButtons()
	dialogBox.Text =
		"⚠️ 3 CZERWONE FLAGI OSZUSTWA:\n1. 🎁 Zbyt piękne, by było prawdziwe ('Darmowe 10 000 Robuxów!')\n2. ⏱️ Presja czasu ('Tylko 60 sekund!')\n3. 🔑 Prośba o hasło lub kod SMS. Prawdziwy pracownik Roblox NIGDY o to nie pyta!"

	createChoiceBtn(1, "🚨 Ktoś na placu rozdaje Robuxy!", function()
		showReportAdvice()
	end, Color3.fromRGB(200, 60, 60))

	createChoiceBtn(2, "🛡️ Złote zasady", function()
		showRules()
	end)

	createChoiceBtn(3, "🔙 Wróć do menu", function()
		showMainMenu()
	end)
end

showRules = function()
	clearButtons()
	dialogBox.Text =
		"🛡️ 3 ZŁOTE ZASADY BEZPIECZEŃSTWA:\n1. 🔑 NIGDY nie podawaj nikomu hasła ani kodów SMS.\n2. 👮 Roblox NIGDY nie prosi o hasło na czacie.\n3. ⏱️ Gdy ktoś każe działać 'szybko' – zwolnij i zapytaj rodzica lub opiekuna!"

	createChoiceBtn(1, "🔍 Czym jest Phishing?", function()
		showPhishingInfo()
	end, Color3.fromRGB(30, 100, 200))

	createChoiceBtn(2, "🚨 Podejrzany gracz w lobby", function()
		showReportAdvice()
	end, Color3.fromRGB(200, 60, 60))

	createChoiceBtn(3, "🔙 Wróć do menu", function()
		showMainMenu()
	end)
end

showReportAdvice = function()
	clearButtons()
	dialogBox.Text =
		"👀 ZAUWAŻYŁEŚ GRACZA 'FreeRobux_Giver'? To klasyczny podstęp! Podejdź do niego [E] i sprawdź, czy rozpoznasz jego manipulacje. Pamiętaj: pod żadnym pozorem nie podawaj kodu – odrzuć ofertę!"

	createChoiceBtn(1, "🚶 Idę sprawdzić oszusta!", function()
		closeUI()
	end, Color3.fromRGB(40, 160, 60))

	createChoiceBtn(2, "🔙 Wróć do menu", function()
		showMainMenu()
	end)
end

-- Nasłuchuj zdarzenia otwarcia/zamknięcia od serwera
remoteEvent.OnClientEvent:Connect(function(action: string)
	if action == "open" then
		showMainMenu()
		openUI()
	elseif action == "close" then
		closeUI()
	end
end)

-- Bezpośrednie uruchamianie dialogu klawiszem [E] w promieniu Scamerino (bez domyślnego infoboxa)
UserInputService.InputBegan:Connect(function(input: InputObject, gameProcessed: boolean)
	if gameProcessed then
		return
	end
	if input.KeyCode == Enum.KeyCode.E then
		local dist = getDistanceToScamerino()
		if dist and dist <= INTERACTION_DISTANCE then
			if not isDialogueOpen then
				showMainMenu()
				openUI()
			end
		end
	end
end)

-- Obsługa wyzwolenia ProximityPrompt
local function hookPrompt(prompt: Instance)
	if prompt:IsA("ProximityPrompt") and prompt.Name == "ChatPrompt" then
		prompt.Triggered:Connect(function(triggerPlayer)
			if triggerPlayer == player and not isDialogueOpen then
				showMainMenu()
				openUI()
			end
		end)
	end
end

ProximityPromptService.PromptTriggered:Connect(function(prompt, triggerPlayer)
	if
		triggerPlayer == player
		and (
			prompt.Name == "ChatPrompt"
			or (prompt.Parent and prompt.Parent.Parent and prompt.Parent.Parent.Name == "ScamerinoAlertinio")
		)
	then
		if not isDialogueOpen then
			showMainMenu()
			openUI()
		end
	end
end)

local scamerino = workspace:FindFirstChild("ScamerinoAlertinio")
local torso = scamerino and scamerino:FindFirstChild("Torso")
local existingPrompt = torso and torso:FindFirstChild("ChatPrompt")
if existingPrompt then
	hookPrompt(existingPrompt)
end

workspace.DescendantAdded:Connect(function(desc)
	if desc.Name == "ChatPrompt" and desc:IsA("ProximityPrompt") then
		hookPrompt(desc)
	end
end)

-- Automatyczne zamykanie dialogu po odejściu na odległość > BREAK_DISTANCE
RunService.Heartbeat:Connect(function()
	if isDialogueOpen then
		local dist = getDistanceToScamerino()
		if not dist or dist > BREAK_DISTANCE then
			closeUI()
		end
	end
end)

player.CharacterRemoving:Connect(function()
	if isDialogueOpen then
		closeUI()
	end
end)
