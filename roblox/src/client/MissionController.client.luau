--!strict
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui") :: PlayerGui

local MissionContent = require(ReplicatedStorage:WaitForChild("MissionContent") :: ModuleScript)
local remotesFolder = ReplicatedStorage:WaitForChild("MissionRemotes")
local requestActionRemote = remotesFolder:WaitForChild("RequestAction") :: RemoteEvent
local missionUpdateRemote = remotesFolder:WaitForChild("MissionUpdate") :: RemoteEvent

-- Create custom ScreenGui
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "MissionGui"
screenGui.ResetOnSpawn = false
screenGui.IgnoreGuiInset = true
screenGui.Parent = playerGui

-- Main container frame (lower-third dialogue bar, avatar-safe)
local mainFrame = Instance.new("Frame")
mainFrame.Name = "DialogueFrame"
mainFrame.Size = UDim2.fromScale(0.92, 0.38)
mainFrame.Position = UDim2.new(0.5, 0, 1, -20)
mainFrame.AnchorPoint = Vector2.new(0.5, 1)
mainFrame.BackgroundColor3 = Color3.fromRGB(14, 20, 32)
mainFrame.BackgroundTransparency = 0.08
mainFrame.BorderSizePixel = 0
mainFrame.Visible = false
mainFrame.Parent = screenGui

local sizeConstraint = Instance.new("UISizeConstraint")
sizeConstraint.MaxSize = Vector2.new(820, 300)
sizeConstraint.MinSize = Vector2.new(320, 200)
sizeConstraint.Parent = mainFrame

local uiCorner = Instance.new("UICorner")
uiCorner.CornerRadius = UDim.new(0, 16)
uiCorner.Parent = mainFrame

local uiStroke = Instance.new("UIStroke")
uiStroke.Color = Color3.fromRGB(0, 170, 255)
uiStroke.Thickness = 2.5
uiStroke.Parent = mainFrame

-- Helper Portrait (compact left column)
local portraitFrame = Instance.new("Frame")
portraitFrame.Name = "PortraitFrame"
portraitFrame.Size = UDim2.new(0, 110, 1, -20)
portraitFrame.Position = UDim2.fromOffset(10, 10)
portraitFrame.BackgroundColor3 = Color3.fromRGB(15, 30, 50)
portraitFrame.BorderSizePixel = 0
portraitFrame.Parent = mainFrame

local portraitCorner = Instance.new("UICorner")
portraitCorner.CornerRadius = UDim.new(0, 12)
portraitCorner.Parent = portraitFrame

local portraitImage = Instance.new("ImageLabel")
portraitImage.Name = "ScamerinoPortrait"
portraitImage.Size = UDim2.new(1, 0, 1, -26)
portraitImage.Position = UDim2.new(0, 0, 0, 0)
portraitImage.BackgroundTransparency = 1
portraitImage.Image = "rbxassetid://10769168213"
portraitImage.ScaleType = Enum.ScaleType.Fit
portraitImage.Parent = portraitFrame

local portraitLabel = Instance.new("TextLabel")
portraitLabel.Name = "PortraitName"
portraitLabel.Size = UDim2.new(1, 0, 0, 24)
portraitLabel.Position = UDim2.new(0, 0, 1, -24)
portraitLabel.BackgroundColor3 = Color3.fromRGB(0, 100, 200)
portraitLabel.Text = "MatiBuilds"
portraitLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
portraitLabel.Font = Enum.Font.FredokaOne
portraitLabel.TextSize = 13
portraitLabel.TextWrapped = true
portraitLabel.Parent = portraitFrame

local pLabelCorner = Instance.new("UICorner")
pLabelCorner.CornerRadius = UDim.new(0, 8)
pLabelCorner.Parent = portraitLabel

-- Content Frame (right side of portrait)
local contentFrame = Instance.new("Frame")
contentFrame.Name = "ContentFrame"
contentFrame.Size = UDim2.new(1, -135, 1, -20)
contentFrame.Position = UDim2.fromOffset(125, 10)
contentFrame.BackgroundTransparency = 1
contentFrame.Parent = mainFrame

local titleLabel = Instance.new("TextLabel")
titleLabel.Name = "TitleLabel"
titleLabel.Size = UDim2.new(1, 0, 0, 24)
titleLabel.Position = UDim2.new(0, 0, 0, 0)
titleLabel.BackgroundTransparency = 1
titleLabel.Font = Enum.Font.FredokaOne
titleLabel.TextSize = 18
titleLabel.TextColor3 = Color3.fromRGB(255, 220, 50)
titleLabel.TextXAlignment = Enum.TextXAlignment.Left
titleLabel.TextWrapped = true
titleLabel.Text = "MatiBuilds"
titleLabel.Parent = contentFrame

local bodyLabel = Instance.new("TextLabel")
bodyLabel.Name = "BodyLabel"
bodyLabel.Size = UDim2.new(1, 0, 1, -80)
bodyLabel.Position = UDim2.fromOffset(0, 26)
bodyLabel.BackgroundTransparency = 1
bodyLabel.Font = Enum.Font.GothamMedium
bodyLabel.TextSize = 12
bodyLabel.TextColor3 = Color3.fromRGB(240, 240, 240)
bodyLabel.TextXAlignment = Enum.TextXAlignment.Left
bodyLabel.TextYAlignment = Enum.TextYAlignment.Top
bodyLabel.TextWrapped = true
bodyLabel.Text = ""
bodyLabel.Parent = contentFrame

-- Choices container with UIListLayout for ordering
local choicesContainer = Instance.new("Frame")
choicesContainer.Name = "ChoicesContainer"
choicesContainer.Size = UDim2.new(1, 0, 0, 48)
choicesContainer.Position = UDim2.new(0, 0, 1, -48)
choicesContainer.BackgroundTransparency = 1
choicesContainer.Parent = contentFrame

local listLayout = Instance.new("UIListLayout")
listLayout.FillDirection = Enum.FillDirection.Horizontal
listLayout.HorizontalAlignment = Enum.HorizontalAlignment.Left
listLayout.VerticalAlignment = Enum.VerticalAlignment.Center
listLayout.Padding = UDim.new(0, 12)
listLayout.Parent = choicesContainer

local function clearChoices()
	for _, child in ipairs(choicesContainer:GetChildren()) do
		if child:IsA("TextButton") then
			child:Destroy()
		end
	end
end

local function createChoiceButton(label: string, color: Color3, callback: () -> ()): TextButton
	local btn = Instance.new("TextButton")
	btn.Size = UDim2.fromOffset(180, 44) -- min 44px touch target height
	btn.BackgroundColor3 = color
	btn.TextColor3 = Color3.fromRGB(255, 255, 255)
	btn.Font = Enum.Font.FredokaOne
	btn.TextSize = 15
	btn.TextWrapped = true
	btn.Text = label
	btn.AutoButtonColor = true

	local btnCorner = Instance.new("UICorner")
	btnCorner.CornerRadius = UDim.new(0, 10)
	btnCorner.Parent = btn

	local btnStroke = Instance.new("UIStroke")
	btnStroke.Color = Color3.fromRGB(255, 255, 255)
	btnStroke.Thickness = 1
	btnStroke.Transparency = 0.6
	btnStroke.Parent = btn

	btn.Activated:Connect(callback)
	btn.Parent = choicesContainer
	return btn
end

-- Render stages
local function renderStage(stage: string)
	if stage == "start" or stage == "closed" then
		mainFrame.Visible = false
		return
	end

	mainFrame.Visible = true
	clearChoices()

	if stage == "decision" then
		titleLabel.Text = "MatiBuilds"
		titleLabel.TextColor3 = Color3.fromRGB(255, 220, 50)
		bodyLabel.Text = MissionContent.texts.offer_intro .. "\n\n" .. MissionContent.texts.decision

		-- Render the two enabled choices with neutral styling so as not to suggest the solution
		for _, choice in ipairs(MissionContent.choices) do
			if choice.enabled then
				local color = Color3.fromRGB(36, 82, 138) -- Neutral slate-blue

				local btn = createChoiceButton(choice.label, color, function()
					requestActionRemote:FireServer(choice.id)
				end)
				btn.Size = UDim2.fromOffset(270, 44)
				btn.TextSize = 13
			end
		end
	elseif stage == "ending_good" then
		titleLabel.Text = "Świetna decyzja!"
		titleLabel.TextColor3 = Color3.fromRGB(46, 204, 113)
		bodyLabel.Text = MissionContent.texts.ending_good

		local btn = createChoiceButton("Zagraj ponownie", Color3.fromRGB(52, 152, 219), function()
			requestActionRemote:FireServer("replay")
		end)
		btn.Size = UDim2.fromOffset(180, 44)
	elseif stage == "ending_bad" then
		titleLabel.Text = "Konto przejęte!"
		titleLabel.TextColor3 = Color3.fromRGB(231, 76, 60)
		bodyLabel.Text = MissionContent.texts.ending_bad

		local btn = createChoiceButton("Zagraj ponownie", Color3.fromRGB(52, 152, 219), function()
			requestActionRemote:FireServer("replay")
		end)
		btn.Size = UDim2.fromOffset(180, 44)
	end
end

missionUpdateRemote.OnClientEvent:Connect(function(stage: string)
	renderStage(stage)
end)
