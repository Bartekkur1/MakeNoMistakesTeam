--!strict
local Players = game:GetService("Players")
local Debris = game:GetService("Debris")

local RewardManager = {}
type Session = { earned: boolean, burstShown: boolean }
local sessions: { [Player]: Session } = {}
local NAME = "ScamerinoShieldAccessory"
local BLUE = Color3.fromRGB(15, 98, 219)
local DARK_BLUE = Color3.fromRGB(10, 59, 140)
local GOLD = Color3.fromRGB(255, 184, 0)

local function shield(): Accessory
	local accessory = Instance.new("Accessory")
	accessory.Name = NAME
	accessory.AccessoryType = Enum.AccessoryType.Back
	local handle = Instance.new("Part")
	handle.Name = "Handle"
	handle.Size = Vector3.new(1.8, 1.5, 0.22)
	handle.Color = GOLD
	handle.Material = Enum.Material.Metal
	handle.CanCollide = false
	handle.CanTouch = false
	handle.CanQuery = false
	handle.Massless = true
	handle.Parent = accessory
	local attachment = Instance.new("Attachment")
	attachment.Name = "BodyBackAttachment"
	attachment.Position = Vector3.new(0, 0.15, -0.18)
	attachment.Parent = handle
	local function piece(name: string, size: Vector3, offset: CFrame, color: Color3)
		local part = Instance.new("Part")
		part.Name = name
		part.Size = size
		part.CFrame = handle.CFrame * offset
		part.Color = color
		part.Material = Enum.Material.Metal
		part.CanCollide = false
		part.CanTouch = false
		part.CanQuery = false
		part.Massless = true
		part.Parent = accessory
		local weld = Instance.new("Weld")
		weld.Part0 = handle
		weld.Part1 = part
		weld.C0 = offset
		weld.Parent = part
	end
	-- Overlapping upper face and pointed lower diamond give a shield silhouette.
	piece("GoldPoint", Vector3.new(1.27, 1.27, 0.22), CFrame.new(0, -0.68, 0) * CFrame.Angles(0, 0, math.pi / 4), GOLD)
	piece(
		"BluePoint",
		Vector3.new(1.04, 1.04, 0.26),
		CFrame.new(0, -0.64, 0.01) * CFrame.Angles(0, 0, math.pi / 4),
		DARK_BLUE
	)
	piece("BlueFace", Vector3.new(1.52, 1.27, 0.28), CFrame.new(0, 0.02, 0.02), BLUE)
	piece("DarkCrest", Vector3.new(0.35, 1.12, 0.08), CFrame.new(0, -0.04, 0.2), DARK_BLUE)
	return accessory
end

local function attach(player: Player, character: Model, allowBurst: boolean)
	local session = sessions[player]
	if not session or not session.earned then
		return
	end
	local humanoid = character:WaitForChild("Humanoid", 10)
	if not humanoid or not humanoid:IsA("Humanoid") or player.Character ~= character or player.Parent ~= Players then
		return
	end
	local existing: Accessory? = nil
	for _, child in character:GetChildren() do
		if child:IsA("Accessory") and child.Name == NAME then
			if existing then
				child:Destroy()
			else
				existing = child
			end
		end
	end
	local accessory = existing or shield()
	if not existing then
		humanoid:AddAccessory(accessory)
	end
	if allowBurst and not session.burstShown then
		session.burstShown = true
		local emitter = Instance.new("ParticleEmitter")
		emitter.Name = "FirstEarnedGoldBurst"
		emitter.Color = ColorSequence.new(GOLD)
		emitter.LightEmission = 0.8
		emitter.Lifetime = NumberRange.new(0.3, 0.6)
		emitter.Speed = NumberRange.new(2, 5)
		emitter.SpreadAngle = Vector2.new(180, 180)
		emitter.Rate = 55
		emitter.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0.16), NumberSequenceKeypoint.new(1, 0) })
		emitter.Parent = accessory:FindFirstChild("Handle")
		task.delay(2, function()
			emitter.Enabled = false
			Debris:AddItem(emitter, 0.6)
		end)
	end
end

function RewardManager.hasEarned(player: Player): boolean
	local session = sessions[player]
	return session ~= nil and session.earned
end

function RewardManager.grantShield(player: Player): boolean
	local session = sessions[player]
	if not session then
		session = { earned = false, burstShown = false }
		sessions[player] = session
	end
	local firstEarned = not session.earned
	session.earned = true
	local character = player.Character
	if character then
		task.spawn(attach, player, character, firstEarned)
	end
	return firstEarned
end

function RewardManager.restoreShield(player: Player, character: Model)
	attach(player, character, false)
end

function RewardManager.forgetPlayer(player: Player)
	sessions[player] = nil
end

return RewardManager
