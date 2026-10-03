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

-- Simulated Private Chat Panel per D-14, D-18
local chatFrame = Instance.new("Frame")
chatFrame.Name = "SimulatedChatFrame"
chatFrame.Size = UDim2.fromScale(0.32, 0.48)
chatFrame.Position = UDim2.fromScale(0.04, 0.95)
chatFrame.AnchorPoint = Vector2.new(0, 1)
chatFrame.BackgroundColor3 = Color3.fromRGB(15, 22, 34)
chatFrame.BackgroundTransparency = 0.05
chatFrame.BorderSizePixel = 0
chatFrame.Visible = false
chatFrame.Parent = screenGui

local sizeConstraint = Instance.new("UISizeConstraint")
sizeConstraint.MaxSize = Vector2.new(440, 420)
sizeConstraint.MinSize = Vector2.new(280, 260)
sizeConstraint.Parent = chatFrame

local frameCorner = Instance.new("UICorner")
frameCorner.CornerRadius = UDim.new(0, 12)
frameCorner.Parent = chatFrame

local frameStroke = Instance.new("UIStroke")
frameStroke.Color = Color3.fromRGB(0, 160, 240)
frameStroke.Thickness = 2
frameStroke.Parent = chatFrame

-- Header Bar (38px)
local headerBar = Instance.new("Frame")
headerBar.Name = "HeaderBar"
headerBar.Size = UDim2.new(1, 0, 0, 38)
headerBar.Position = UDim2.fromOffset(0, 0)
headerBar.BackgroundColor3 = Color3.fromRGB(22, 32, 48)
headerBar.BorderSizePixel = 0
headerBar.Parent = chatFrame

local headerCorner = Instance.new("UICorner")
headerCorner.CornerRadius = UDim.new(0, 12)
headerCorner.Parent = headerBar

local titleLabel = Instance.new("TextLabel")
titleLabel.Name = "TitleLabel"
titleLabel.Size = UDim2.new(1, -70, 0, 20)
titleLabel.Position = UDim2.fromOffset(12, 4)
titleLabel.BackgroundTransparency = 1
titleLabel.Font = Enum.Font.FredokaOne
titleLabel.TextSize = 14
titleLabel.TextColor3 = Color3.fromRGB(255, 220, 50)
titleLabel.TextXAlignment = Enum.TextXAlignment.Left
titleLabel.Text = "MatiBuilds"
titleLabel.Parent = headerBar

local subTitleLabel = Instance.new("TextLabel")
subTitleLabel.Name = "SubTitleLabel"
subTitleLabel.Size = UDim2.new(1, -70, 0, 14)
subTitleLabel.Position = UDim2.fromOffset(12, 22)
subTitleLabel.BackgroundTransparency = 1
subTitleLabel.Font = Enum.Font.Gotham
subTitleLabel.TextSize = 10
subTitleLabel.TextColor3 = Color3.fromRGB(130, 200, 255)
subTitleLabel.TextXAlignment = Enum.TextXAlignment.Left
subTitleLabel.Text = "Wiadomość prywatna (symulacja)"
subTitleLabel.Parent = headerBar

local closeBtn = Instance.new("TextButton")
closeBtn.Name = "CloseButton"
closeBtn.Size = UDim2.fromOffset(28, 28)
closeBtn.Position = UDim2.new(1, -34, 0, 5)
closeBtn.BackgroundColor3 = Color3.fromRGB(40, 50, 70)
closeBtn.TextColor3 = Color3.fromRGB(220, 220, 220)
closeBtn.Font = Enum.Font.GothamBold
closeBtn.TextSize = 14
closeBtn.Text = "✕"
closeBtn.Parent = headerBar

local closeCorner = Instance.new("UICorner")
closeCorner.CornerRadius = UDim.new(0, 6)
closeCorner.Parent = closeBtn

closeBtn.Activated:Connect(function()
	requestActionRemote:FireServer("close")
end)

-- Messages History (ScrollingFrame)
local messageScroll = Instance.new("ScrollingFrame")
messageScroll.Name = "MessageScroll"
messageScroll.Size = UDim2.new(1, -16, 1, -145)
messageScroll.Position = UDim2.fromOffset(8, 44)
messageScroll.BackgroundTransparency = 1
messageScroll.BorderSizePixel = 0
messageScroll.ScrollBarThickness = 4
messageScroll.ScrollBarImageColor3 = Color3.fromRGB(60, 100, 150)
messageScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
messageScroll.CanvasSize = UDim2.new(0, 0, 0, 0)
messageScroll.Parent = chatFrame

local messageLayout = Instance.new("UIListLayout")
messageLayout.FillDirection = Enum.FillDirection.Vertical
messageLayout.HorizontalAlignment = Enum.HorizontalAlignment.Left
messageLayout.VerticalAlignment = Enum.VerticalAlignment.Top
messageLayout.Padding = UDim.new(0, 8)
messageLayout.Parent = messageScroll

-- Choices Container at bottom
local choicesContainer = Instance.new("Frame")
choicesContainer.Name = "ChoicesContainer"
choicesContainer.Size = UDim2.new(1, -16, 0, 92)
choicesContainer.Position = UDim2.new(0, 8, 1, -96)
choicesContainer.BackgroundTransparency = 1
choicesContainer.Parent = chatFrame

local choicesLayout = Instance.new("UIListLayout")
choicesLayout.FillDirection = Enum.FillDirection.Vertical
choicesLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
choicesLayout.VerticalAlignment = Enum.VerticalAlignment.Center
choicesLayout.Padding = UDim.new(0, 6)
choicesLayout.Parent = choicesContainer

local function clearContainer(container: Instance)
	for _, child in ipairs(container:GetChildren()) do
		if not child:IsA("UIListLayout") and not child:IsA("UIPadding") and not child:IsA("UICorner") then
			child:Destroy()
		end
	end
end

local function renderMessageBubble(msg: MissionContent.ChatMessage)
	local isPlayer = (msg.sender == "Ty")
	local isSystem = (msg.sender == "System")

	local bubbleContainer = Instance.new("Frame")
	bubbleContainer.Size = UDim2.fromScale(1, 0)
	bubbleContainer.AutomaticSize = Enum.AutomaticSize.Y
	bubbleContainer.BackgroundTransparency = 1

	local bubble = Instance.new("Frame")
	bubble.AutomaticSize = Enum.AutomaticSize.XY
	bubble.BorderSizePixel = 0

	local bubbleCorner = Instance.new("UICorner")
	bubbleCorner.CornerRadius = UDim.new(0, 8)
	bubbleCorner.Parent = bubble

	local textLabel = Instance.new("TextLabel")
	textLabel.Font = Enum.Font.GothamMedium
	textLabel.TextSize = 12
	textLabel.TextWrapped = true
	textLabel.AutomaticSize = Enum.AutomaticSize.XY
	textLabel.BackgroundTransparency = 1

	local pad = Instance.new("UIPadding")
	pad.PaddingLeft = UDim.new(0, 8)
	pad.PaddingRight = UDim.new(0, 8)
	pad.PaddingTop = UDim.new(0, 6)
	pad.PaddingBottom = UDim.new(0, 6)
	pad.Parent = textLabel

	if isSystem then
		bubble.BackgroundColor3 = Color3.fromRGB(35, 45, 65)
		bubble.AnchorPoint = Vector2.new(0.5, 0)
		bubble.Position = UDim2.fromScale(0.5, 0)
		textLabel.TextColor3 = Color3.fromRGB(240, 220, 100)
		textLabel.Text = msg.text
	elseif isPlayer then
		bubble.BackgroundColor3 = Color3.fromRGB(36, 110, 185) -- Player blue
		bubble.AnchorPoint = Vector2.new(1, 0)
		bubble.Position = UDim2.fromScale(1, 0)
		textLabel.TextColor3 = Color3.fromRGB(255, 255, 255)
		textLabel.Text = msg.text
	else
		bubble.BackgroundColor3 = Color3.fromRGB(28, 38, 56) -- NPC dark slate
		bubble.AnchorPoint = Vector2.new(0, 0)
		bubble.Position = UDim2.fromOffset(0, 0)
		textLabel.TextColor3 = Color3.fromRGB(230, 235, 245)
		textLabel.Text = msg.text
	end

	textLabel.Parent = bubble
	bubble.Parent = bubbleContainer
	bubbleContainer.Parent = messageScroll
end

local function createChoiceButton(label: string, color: Color3, callback: () -> ()): TextButton
	local btn = Instance.new("TextButton")
	btn.Size = UDim2.new(1, 0, 0, 40)
	btn.BackgroundColor3 = color
	btn.TextColor3 = Color3.fromRGB(255, 255, 255)
	btn.Font = Enum.Font.FredokaOne
	btn.TextSize = 13
	btn.TextWrapped = true
	btn.Text = label
	btn.AutoButtonColor = true

	local btnCorner = Instance.new("UICorner")
	btnCorner.CornerRadius = UDim.new(0, 8)
	btnCorner.Parent = btn

	local btnStroke = Instance.new("UIStroke")
	btnStroke.Color = Color3.fromRGB(255, 255, 255)
	btnStroke.Thickness = 1
	btnStroke.Transparency = 0.7
	btnStroke.Parent = btn

	btn.Activated:Connect(callback)
	btn.Parent = choicesContainer
	return btn
end

local function renderSnapshot(snapshot: MissionContent.MissionSnapshot)
	if snapshot.status == "start" or snapshot.status == "closed" or snapshot.activeConversation == "none" then
		chatFrame.Visible = false
		return
	end

	chatFrame.Visible = true
	titleLabel.Text = snapshot.title or "MatiBuilds"

	-- Clear and rebuild message history
	clearContainer(messageScroll)
	local messages = if snapshot.activeConversation == "scamerino"
		then (snapshot.histories and snapshot.histories.scamerino or {})
		else (snapshot.histories and snapshot.histories.mati or {})

	for _, msg in ipairs(messages) do
		renderMessageBubble(msg)
	end

	-- Auto scroll to bottom
	task.defer(function()
		messageScroll.CanvasPosition = Vector2.new(0, 99999)
	end)

	-- Render choices
	clearContainer(choicesContainer)

	if snapshot.status == "decision" then
		for _, choice in ipairs(snapshot.choices) do
			if choice.enabled then
				-- Neutral slate-blue for both choices per D-14
				createChoiceButton(choice.label, Color3.fromRGB(36, 82, 138), function()
					requestActionRemote:FireServer(choice.id)
				end)
			end
		end
	elseif snapshot.status == "ending_good" or snapshot.status == "ending_bad" then
		createChoiceButton("Zagraj ponownie", Color3.fromRGB(52, 152, 219), function()
			requestActionRemote:FireServer("replay")
		end)
	end
end

missionUpdateRemote.OnClientEvent:Connect(function(data: any)
	if typeof(data) == "table" and data.revision ~= nil then
		renderSnapshot(data :: MissionContent.MissionSnapshot)
	elseif typeof(data) == "string" then
		-- Fallback compatibility for simple stage strings
		if data == "closed" or data == "start" then
			chatFrame.Visible = false
		end
	end
end)
