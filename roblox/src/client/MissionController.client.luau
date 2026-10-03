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

-- Main container frame (responsive center-bottom anchor, phone-safe width)
local mainFrame = Instance.new("Frame")
mainFrame.Name = "DialogueFrame"
mainFrame.Size = UDim2.fromScale(0.85, 0.45)
mainFrame.Position = UDim2.fromScale(0.5, 0.72)
mainFrame.AnchorPoint = Vector2.new(0.5, 0.5)
mainFrame.BackgroundColor3 = Color3.fromRGB(20, 24, 34)
mainFrame.BackgroundTransparency = 0.05
mainFrame.BorderSizePixel = 0
mainFrame.Visible = false
mainFrame.Parent = screenGui

local uiCorner = Instance.new("UICorner")
uiCorner.CornerRadius = UDim.new(0, 16)
uiCorner.Parent = mainFrame

local uiStroke = Instance.new("UIStroke")
uiStroke.Color = Color3.fromRGB(0, 170, 255)
uiStroke.Thickness = 3
uiStroke.Parent = mainFrame

-- Helper Portrait (ImageLabel)
local portraitFrame = Instance.new("Frame")
portraitFrame.Name = "PortraitFrame"
portraitFrame.Size = UDim2.fromScale(0.2, 0.75)
portraitFrame.Position = UDim2.fromScale(0.02, 0.12)
portraitFrame.BackgroundColor3 = Color3.fromRGB(15, 30, 50)
portraitFrame.BorderSizePixel = 0
portraitFrame.Parent = mainFrame

local portraitCorner = Instance.new("UICorner")
portraitCorner.CornerRadius = UDim.new(0, 12)
portraitCorner.Parent = portraitFrame

local portraitImage = Instance.new("ImageLabel")
portraitImage.Name = "ScamerinoPortrait"
portraitImage.Size = UDim2.fromScale(1, 1)
portraitImage.BackgroundTransparency = 1
-- Use fallback local avatar or asset ID if available
portraitImage.Image = "rbxassetid://10769168213" -- placeholder / moderated ID
portraitImage.ScaleType = Enum.ScaleType.Fit
portraitImage.Parent = portraitFrame

local portraitLabel = Instance.new("TextLabel")
portraitLabel.Name = "PortraitName"
portraitLabel.Size = UDim2.fromScale(1, 0.25)
portraitLabel.Position = UDim2.fromScale(0, 0.75)
portraitLabel.BackgroundColor3 = Color3.fromRGB(0, 100, 200)
portraitLabel.Text = "SCAMERINO"
portraitLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
portraitLabel.Font = Enum.Font.FredokaOne
portraitLabel.TextSize = 14
portraitLabel.TextWrapped = true
portraitLabel.Parent = portraitFrame

-- Content Frame (right side of portrait)
local contentFrame = Instance.new("Frame")
contentFrame.Name = "ContentFrame"
contentFrame.Size = UDim2.fromScale(0.74, 0.85)
contentFrame.Position = UDim2.fromScale(0.24, 0.08)
contentFrame.BackgroundTransparency = 1
contentFrame.Parent = mainFrame

local titleLabel = Instance.new("TextLabel")
titleLabel.Name = "TitleLabel"
titleLabel.Size = UDim2.fromScale(1, 0.2)
titleLabel.BackgroundTransparency = 1
titleLabel.Font = Enum.Font.FredokaOne
titleLabel.TextSize = 20
titleLabel.TextColor3 = Color3.fromRGB(255, 220, 50)
titleLabel.TextXAlignment = Enum.TextXAlignment.Left
titleLabel.TextWrapped = true
titleLabel.Text = "FreeRobux_Giver"
titleLabel.Parent = contentFrame

local bodyLabel = Instance.new("TextLabel")
bodyLabel.Name = "BodyLabel"
bodyLabel.Size = UDim2.fromScale(1, 0.45)
bodyLabel.Position = UDim2.fromScale(0, 0.2)
bodyLabel.BackgroundTransparency = 1
bodyLabel.Font = Enum.Font.SourceSans
bodyLabel.TextSize = 16
bodyLabel.TextColor3 = Color3.fromRGB(240, 240, 240)
bodyLabel.TextXAlignment = Enum.TextXAlignment.Left
bodyLabel.TextYAlignment = Enum.TextYAlignment.Top
bodyLabel.TextWrapped = true
bodyLabel.Text = ""
bodyLabel.Parent = contentFrame

-- Choices container with UIListLayout for ordering
local choicesContainer = Instance.new("Frame")
choicesContainer.Name = "ChoicesContainer"
choicesContainer.Size = UDim2.fromScale(1, 0.35)
choicesContainer.Position = UDim2.fromScale(0, 0.65)
choicesContainer.BackgroundTransparency = 1
choicesContainer.Parent = contentFrame

local listLayout = Instance.new("UIListLayout")
listLayout.FillDirection = Enum.FillDirection.Horizontal
listLayout.HorizontalAlignment = Enum.HorizontalAlignment.Left
listLayout.VerticalAlignment = Enum.VerticalAlignment.Center
listLayout.Padding = UDim.new(0, 10)
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
	btn.Size = UDim2.fromOffset(150, 44) -- min 44px touch target height
	btn.BackgroundColor3 = color
	btn.TextColor3 = Color3.fromRGB(255, 255, 255)
	btn.Font = Enum.Font.FredokaOne
	btn.TextSize = 16
	btn.TextWrapped = true
	btn.Text = label
	btn.AutoButtonColor = true

	local btnCorner = Instance.new("UICorner")
	btnCorner.CornerRadius = UDim.new(0, 8)
	btnCorner.Parent = btn

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
		titleLabel.Text = "FreeRobux_Giver: Podejrzana Oferta!"
		titleLabel.TextColor3 = Color3.fromRGB(255, 220, 50)
		bodyLabel.Text = MissionContent.texts.offer_intro .. "\n\n" .. MissionContent.texts.decision

		-- Render the two enabled choices for Phase 1
		for _, choice in ipairs(MissionContent.choices) do
			if choice.enabled then
				local color = if choice.id == "refuse"
					then Color3.fromRGB(46, 204, 113) -- green
					else Color3.fromRGB(231, 76, 60) -- red

				createChoiceButton(choice.label, color, function()
					requestActionRemote:FireServer(choice.id)
				end)
			end
		end
	elseif stage == "ending_good" then
		titleLabel.Text = "Dobrze!"
		titleLabel.TextColor3 = Color3.fromRGB(46, 204, 113)
		bodyLabel.Text = MissionContent.texts.ending_good

		createChoiceButton("Zagraj ponownie", Color3.fromRGB(52, 152, 219), function()
			requestActionRemote:FireServer("replay")
		end)
	elseif stage == "ending_bad" then
		titleLabel.Text = "Dałeś się oszukać"
		titleLabel.TextColor3 = Color3.fromRGB(231, 76, 60)
		bodyLabel.Text = MissionContent.texts.ending_bad

		createChoiceButton("Zagraj ponownie", Color3.fromRGB(52, 152, 219), function()
			requestActionRemote:FireServer("replay")
		end)
	end
end

missionUpdateRemote.OnClientEvent:Connect(function(stage: string)
	renderStage(stage)
end)
