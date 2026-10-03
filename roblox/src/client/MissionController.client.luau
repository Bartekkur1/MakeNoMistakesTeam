--!strict
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TextChatService = game:GetService("TextChatService")
local MissionContent = require(ReplicatedStorage:WaitForChild("MissionContent") :: ModuleScript)
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")
local remotes = ReplicatedStorage:WaitForChild("MissionRemotes")
local request = remotes:WaitForChild("RequestAction") :: RemoteEvent
local update = remotes:WaitForChild("MissionUpdate") :: RemoteEvent
local publicBubble = remotes:WaitForChild("PublicNpcBubble") :: RemoteEvent

local oldGui = playerGui:FindFirstChild("MissionGui")
if oldGui then
	oldGui:Destroy()
end
local gui = Instance.new("ScreenGui")
gui.Name = "MissionGui"
gui.ResetOnSpawn = false
gui.DisplayOrder = 10
gui.Parent = playerGui

local panel = Instance.new("Frame")
panel.Name = "SimulatedChatFrame"
panel.Size = UDim2.fromScale(0.32, 0.56)
panel.AnchorPoint = Vector2.new(0, 1)
panel.Position = UDim2.new(0, 16, 1, -24)
panel.BackgroundColor3 = Color3.fromRGB(28, 29, 32)
panel.BackgroundTransparency = 0.1
panel.BorderSizePixel = 0
panel.Visible = false
panel.Parent = gui

local constraint = Instance.new("UISizeConstraint")
constraint.MinSize = Vector2.new(300, 340)
constraint.MaxSize = Vector2.new(420, 520)
constraint.Parent = panel

local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 6)
corner.Parent = panel

local alertStroke = Instance.new("UIStroke")
alertStroke.Name = "AlertStroke"
alertStroke.Color = Color3.fromRGB(240, 60, 60)
alertStroke.Thickness = 2.5
alertStroke.Enabled = false
alertStroke.Parent = panel

local function label(name: string, parent: Instance, size: number): TextLabel
	local text = Instance.new("TextLabel")
	text.Name = name
	text.BackgroundTransparency = 1
	text.Font = Enum.Font.Gotham
	text.TextSize = size
	text.TextColor3 = Color3.fromRGB(235, 235, 238)
	text.TextXAlignment = Enum.TextXAlignment.Left
	text.TextYAlignment = Enum.TextYAlignment.Top
	text.Parent = parent
	return text
end

local title = label("TitleLabel", panel, 15)
title.Font = Enum.Font.GothamMedium
title.Position = UDim2.fromOffset(12, 10)
title.Size = UDim2.new(1, -54, 0, 20)

local subtitle = label("SubTitleLabel", panel, 11)
subtitle.Text = "Rozmowa prywatna"
subtitle.TextColor3 = Color3.fromRGB(174, 176, 182)
subtitle.Position = UDim2.fromOffset(12, 32)
subtitle.Size = UDim2.new(1, -24, 0, 16)

local close = Instance.new("TextButton")
close.Name = "CloseButton"
close.Size = UDim2.fromOffset(30, 30)
close.Position = UDim2.new(1, -36, 0, 5)
close.BackgroundTransparency = 1
close.Font = Enum.Font.Gotham
close.Text = "×"
close.TextSize = 24
close.TextColor3 = Color3.fromRGB(225, 225, 228)
close.Parent = panel

local tabs = Instance.new("Frame")
tabs.Name = "ConversationTabs"
tabs.Position = UDim2.fromOffset(12, 52)
tabs.Size = UDim2.new(1, -24, 0, 28)
tabs.BackgroundTransparency = 1
tabs.Visible = false
tabs.Parent = panel

local scroll = Instance.new("ScrollingFrame")
scroll.Name = "MessageScroll"
scroll.Position = UDim2.fromOffset(12, 54)
scroll.Size = UDim2.new(1, -24, 1, -164)
scroll.BackgroundTransparency = 1
scroll.BorderSizePixel = 0
scroll.ScrollBarThickness = 3
scroll.ScrollBarImageColor3 = Color3.fromRGB(130, 132, 138)
scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
scroll.CanvasSize = UDim2.new()
scroll.ClipsDescendants = true
scroll.Parent = panel

local messageLayout = Instance.new("UIListLayout")
messageLayout.Padding = UDim.new(0, 9)
messageLayout.SortOrder = Enum.SortOrder.LayoutOrder
messageLayout.Parent = scroll

local status = label("TypingStatus", panel, 11)
status.TextColor3 = Color3.fromRGB(174, 176, 182)

local choices = Instance.new("Frame")
choices.Name = "ChoicesContainer"
choices.BackgroundTransparency = 1
choices.Parent = panel

local choicesLayout = Instance.new("UIListLayout")
choicesLayout.Padding = UDim.new(0, 6)
choicesLayout.SortOrder = Enum.SortOrder.LayoutOrder
choicesLayout.Parent = choices

-- Karta Zasad Roblox (Rule Card Frame)
local ruleCardFrame = Instance.new("Frame")
ruleCardFrame.Name = "RuleCardFrame"
ruleCardFrame.Size = UDim2.fromOffset(440, 340)
ruleCardFrame.Position = UDim2.fromScale(0.5, 0.5)
ruleCardFrame.AnchorPoint = Vector2.new(0.5, 0.5)
ruleCardFrame.BackgroundColor3 = Color3.fromRGB(16, 20, 32)
ruleCardFrame.BorderSizePixel = 0
ruleCardFrame.Visible = false
ruleCardFrame.ZIndex = 20
ruleCardFrame.Parent = gui

local rcCorner = Instance.new("UICorner")
rcCorner.CornerRadius = UDim.new(0, 10)
rcCorner.Parent = ruleCardFrame

local rcStroke = Instance.new("UIStroke")
rcStroke.Color = Color3.fromRGB(80, 140, 240)
rcStroke.Thickness = 2
rcStroke.Parent = ruleCardFrame

local rcTitle = label("RcTitle", ruleCardFrame, 15)
rcTitle.Font = Enum.Font.GothamBold
rcTitle.Position = UDim2.fromOffset(16, 14)
rcTitle.Size = UDim2.new(1, -32, 0, 22)
rcTitle.TextColor3 = Color3.fromRGB(255, 215, 80)
rcTitle.Text = "🛡️ ZASADY BEZPIECZEŃSTWA ROBLOX"

local rcScroll = Instance.new("ScrollingFrame")
rcScroll.Name = "RcScroll"
rcScroll.Position = UDim2.fromOffset(16, 42)
rcScroll.Size = UDim2.new(1, -32, 1, -110)
rcScroll.BackgroundTransparency = 1
rcScroll.BorderSizePixel = 0
rcScroll.ScrollBarThickness = 3
rcScroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
rcScroll.CanvasSize = UDim2.new()
rcScroll.Parent = ruleCardFrame

local rcList = Instance.new("UIListLayout")
rcList.Padding = UDim.new(0, 8)
rcList.SortOrder = Enum.SortOrder.LayoutOrder
rcList.Parent = rcScroll

local rcSource = label("RcSource", ruleCardFrame, 10)
rcSource.Position = UDim2.new(0, 16, 1, -64)
rcSource.Size = UDim2.new(1, -32, 0, 24)
rcSource.TextColor3 = Color3.fromRGB(150, 160, 180)
rcSource.TextWrapped = true

local rcCloseBtn = Instance.new("TextButton")
rcCloseBtn.Name = "RcCloseBtn"
rcCloseBtn.Size = UDim2.new(1, -32, 0, 32)
rcCloseBtn.Position = UDim2.new(0, 16, 1, -36)
rcCloseBtn.BackgroundColor3 = Color3.fromRGB(40, 110, 220)
rcCloseBtn.BorderSizePixel = 0
rcCloseBtn.Font = Enum.Font.GothamBold
rcCloseBtn.TextSize = 13
rcCloseBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
rcCloseBtn.Text = "Rozumiem, wracam do rozmowy"
rcCloseBtn.Parent = ruleCardFrame

local rcBtnCorner = Instance.new("UICorner")
rcBtnCorner.CornerRadius = UDim.new(0, 6)
rcBtnCorner.Parent = rcCloseBtn

local latest: MissionContent.MissionSnapshot? = nil
local selectedConversation = "mati"
local latestSequence = -1
local latestRevision = -1
local pendingAction = false

local function clear(parent: Instance)
	for _, child in parent:GetChildren() do
		if child:IsA("GuiObject") then
			child:Destroy()
		end
	end
end

local function escape(text: string): string
	local escaped = text:gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;")
	return escaped
end

local function messageRow(message: MissionContent.ChatMessage, index: number)
	local row = label("Message", scroll, 14)
	row.Size = UDim2.new(1, -6, 0, 0)
	row.AutomaticSize = Enum.AutomaticSize.Y
	row.TextWrapped = true
	row.RichText = true
	row.LayoutOrder = index
	local color = if message.sender == "Ty"
		then "#B3CFFF"
		elseif message.sender == "System" then "#D1D1D6"
		elseif message.sender == "Scamerino" then "#72D0FF"
		else "#F1C58C"
	local name = if message.sender == "Ty" then player.DisplayName else message.sender
	row.Text = '<font color="' .. color .. '"><b>' .. escape(name) .. ":</b></font> " .. escape(message.text)
end

local function actionButton(text: string, order: number, callback: () -> ())
	local button = Instance.new("TextButton")
	button.Name = "Choice"
	button.Size = UDim2.new(1, 0, 0, 34)
	button.BackgroundColor3 = Color3.fromRGB(55, 57, 63)
	button.BorderSizePixel = 0
	button.Font = Enum.Font.Gotham
	button.TextSize = 13
	button.TextColor3 = Color3.fromRGB(240, 240, 243)
	button.TextWrapped = true
	button.Text = text
	button.LayoutOrder = order
	button.Active = not pendingAction
	button.AutoButtonColor = not pendingAction
	local rounding = Instance.new("UICorner")
	rounding.CornerRadius = UDim.new(0, 4)
	rounding.Parent = button
	button.Activated:Connect(callback)
	button.Parent = choices
end

local render: (MissionContent.MissionSnapshot) -> ()
render = function(snapshot)
	if snapshot.status == "start" or snapshot.status == "closed" or snapshot.activeConversation == "none" then
		panel.Visible = false
		ruleCardFrame.Visible = false
		return
	end
	panel.Visible = true
	panel:SetAttribute("Revision", snapshot.revision)
	panel:SetAttribute("Status", snapshot.status)
	title.Text = if selectedConversation == "scamerino" then "Scamerino" else "MatiBuilds"

	-- Alert stroke & subtitles
	if snapshot.status == "ending_bad" then
		alertStroke.Enabled = true
		subtitle.Text = "⚠️ SYMULACJA: UTRATA DOSTĘPU DO KONTA"
		subtitle.TextColor3 = Color3.fromRGB(255, 80, 80)
	elseif snapshot.status == "ending_good" then
		alertStroke.Enabled = false
		subtitle.Text = "🛡️ KONTO BEZPIECZNE"
		subtitle.TextColor3 = Color3.fromRGB(80, 220, 100)
	else
		alertStroke.Enabled = false
		subtitle.Text = if selectedConversation == "scamerino" then "Cyber-Pomocnik" else "Rozmowa prywatna"
		subtitle.TextColor3 = Color3.fromRGB(174, 176, 182)
	end

	-- Rule card visibility and population
	if snapshot.status == "rule_card" and snapshot.ruleCard then
		ruleCardFrame.Visible = true
		rcTitle.Text = "🛡️ " .. string.upper(snapshot.ruleCard.title)
		clear(rcScroll)
		for i, point in ipairs(snapshot.ruleCard.bulletPoints) do
			local row = label("Point", rcScroll, 12)
			row.Size = UDim2.new(1, -6, 0, 0)
			row.AutomaticSize = Enum.AutomaticSize.Y
			row.TextWrapped = true
			row.Text = "• " .. point
			row.TextColor3 = Color3.fromRGB(235, 238, 245)
			row.LayoutOrder = i
		end
		rcSource.Text = "Źródło: "
			.. snapshot.ruleCard.sourceTitle
			.. " ("
			.. snapshot.ruleCard.sourceUrl
			.. ")\nZweryfikowano: "
			.. snapshot.ruleCard.sourceVerifiedAt
	else
		ruleCardFrame.Visible = false
	end

	local hasHelper = #snapshot.histories.scamerino > 0
	tabs.Visible = hasHelper
	local top = if hasHelper then 88 else 54
	local nearBottom = scroll.CanvasPosition.Y + scroll.AbsoluteSize.Y >= scroll.AbsoluteCanvasSize.Y - 20
	local oldPosition = scroll.CanvasPosition
	clear(scroll)
	local history = if selectedConversation == "scamerino"
		then snapshot.histories.scamerino
		else snapshot.histories.mati
	for index, message in history do
		messageRow(message, index)
	end

	clear(choices)
	local count = 0
	local function submit(action: string)
		if pendingAction or not latest or latest.revision ~= snapshot.revision then
			return
		end
		pendingAction = true
		request:FireServer(action, snapshot.revision)
	end

	local isDecision = snapshot.status == "decision"
		or snapshot.status == "refusal_pressure"
		or snapshot.status == "decision_after_check"
		or snapshot.status == "decision_after_help"
		or snapshot.status == "helper_quiz"

	local showChoices = (snapshot.status == "helper_quiz" and selectedConversation == "scamerino")
		or (isDecision and selectedConversation == "mati")

	if showChoices then
		for _, choice in snapshot.choices do
			if choice.enabled then
				count += 1
				actionButton(choice.label, count, function()
					submit(choice.id)
				end)
			end
		end
	elseif isDecision and selectedConversation == "scamerino" then
		count = 1
		actionButton("Wróć do rozmowy z MatiBuilds", 1, function()
			selectedConversation = "mati"
			render(snapshot)
		end)
	elseif snapshot.status == "rule_card" then
		count = 1
		actionButton("Pokaż kartę zasad", 1, function()
			ruleCardFrame.Visible = true
		end)
	elseif snapshot.status == "ending_good" or snapshot.status == "ending_bad" then
		count = 1
		actionButton("Spróbuj ponownie", 1, function()
			submit("replay")
		end)
	end

	local choicesHeight = if count > 0 then count * 34 + (count - 1) * 6 else 0
	choices.Position = UDim2.new(0, 12, 1, -12 - choicesHeight)
	choices.Size = UDim2.new(1, -24, 0, choicesHeight)
	status.Position = UDim2.new(0, 12, 1, -choicesHeight - 34)
	status.Size = UDim2.new(1, -24, 0, 16)
	status.Text = if snapshot.status == "presenting" or snapshot.status == "responding"
		then title.Text .. " pisze…"
		elseif snapshot.status == "waiting_for_helper" then "Scamerino idzie na pomoc…"
		elseif snapshot.status == "helper_quiz" then "Wybierz odpowiedź w quizie:"
		elseif snapshot.status == "rule_card" then "Zapoznaj się z zasadami bezpieczeństwa:"
		elseif isDecision then "Wybierz odpowiedź:"
		else ""
	scroll.Position = UDim2.fromOffset(12, top)
	scroll.Size = UDim2.new(1, -24, 1, -top - choicesHeight - 42)
	local sequence = snapshot.sequence
	task.defer(function()
		if latestSequence ~= sequence then
			return
		end
		if nearBottom then
			scroll.CanvasPosition = Vector2.new(0, math.max(0, scroll.AbsoluteCanvasSize.Y - scroll.AbsoluteSize.Y))
		else
			scroll.CanvasPosition = oldPosition
		end
	end)
end

for index, conversation in { "mati", "scamerino" } do
	local button = Instance.new("TextButton")
	button.Name = conversation
	button.Size = UDim2.new(0.5, -3, 1, 0)
	button.Position = UDim2.new((index - 1) * 0.5, if index == 1 then 0 else 3, 0, 0)
	button.BackgroundColor3 = Color3.fromRGB(55, 57, 63)
	button.BorderSizePixel = 0
	button.Font = Enum.Font.Gotham
	button.TextSize = 12
	button.TextColor3 = Color3.fromRGB(235, 235, 238)
	button.Text = if conversation == "mati" then "MatiBuilds" else "Scamerino"
	button.Parent = tabs
	button.Activated:Connect(function()
		selectedConversation = conversation
		if latest then
			render(latest)
		end
	end)
end

rcCloseBtn.Activated:Connect(function()
	if not latest then
		return
	end
	ruleCardFrame.Visible = false
	request:FireServer("close_rule_card", latest.revision)
end)

close.Activated:Connect(function()
	if not latest then
		return
	end
	panel.Visible = false
	ruleCardFrame.Visible = false
	request:FireServer("close", latest.revision)
end)

update.OnClientEvent:Connect(function(snapshot: any)
	if
		typeof(snapshot) ~= "table"
		or typeof(snapshot.revision) ~= "number"
		or typeof(snapshot.sequence) ~= "number"
	then
		return
	end
	if snapshot.revision < latestRevision or snapshot.sequence <= latestSequence then
		return
	end
	if
		not latest
		or snapshot.activeConversation ~= latest.activeConversation
		or snapshot.revision ~= latestRevision
	then
		selectedConversation = if snapshot.activeConversation == "scamerino" then "scamerino" else "mati"
	end
	latestSequence = snapshot.sequence
	latestRevision = snapshot.revision
	latest = snapshot :: MissionContent.MissionSnapshot
	pendingAction = false
	render(snapshot)
end)

publicBubble.OnClientEvent:Connect(function(adornee: any, text: any)
	if typeof(adornee) ~= "Instance" or not adornee:IsDescendantOf(workspace) or typeof(text) ~= "string" then
		return
	end
	TextChatService:DisplayBubble(adornee, text)
end)

-- Subscribe before requesting a snapshot; an early approach must not lose the opening.
request:FireServer("ready")
