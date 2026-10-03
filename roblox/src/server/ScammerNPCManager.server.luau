--!strict
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local Chat = game:GetService("Chat")

local lobby = workspace:WaitForChild("MarketplaceLobby", 10) :: Instance?
local npc = lobby and (lobby:WaitForChild("ScammerNPC", 10) :: Model?)
if not npc then
	return
end

local hrp = npc:WaitForChild("HumanoidRootPart", 5) :: BasePart?
local upperTorso = npc:WaitForChild("UpperTorso", 5) :: BasePart?
local head = npc:WaitForChild("Head", 5) :: BasePart?
local lowerTorso = npc:WaitForChild("LowerTorso", 5) :: BasePart?

if not hrp or not upperTorso or not head or not lowerTorso then
	return
end

local neck = (head:FindFirstChild("Neck") or upperTorso:FindFirstChild("Neck")) :: Motor6D?
local waist = (upperTorso:FindFirstChild("Waist") or lowerTorso:FindFirstChild("Waist")) :: Motor6D?

local baseNeckC0 = if neck then neck.C0 else CFrame.new()
local baseWaistC0 = if waist then waist.C0 else CFrame.new()

-- Idle chat shouts
local shouts = {
	"💎 Darmowe Robuxy dla każdego! Podejdź!",
	"🔥 Masz tylko 60 sekund na odebranie 10 000 Robuxów!",
	"⭐ Wygrałeś konkurs! Wciśnij [E] i odbierz nagrodę!",
	"🚀 Wielka promocja Roblox 2026! Darmowe 10k Robux!",
}

task.spawn(function()
	while npc and npc.Parent do
		task.wait(math.random(7, 12))
		local text = shouts[math.random(1, #shouts)]
		pcall(function()
			Chat:Chat(head, text, Enum.ChatColor.Green)
		end)
	end
end)

local clock = 0
RunService.Heartbeat:Connect(function(dt: number)
	clock += dt

	-- Gentle breathing
	local breath = math.sin(clock * 2.2) * 0.02
	local sway = math.cos(clock * 1.5) * 0.015

	if waist and baseWaistC0 then
		waist.C0 = baseWaistC0 * CFrame.Angles(breath * 0.5, sway, 0)
	end

	-- Head tracking towards nearest player
	local nearestChar: Model? = nil
	local nearestDist = 20

	for _, player in ipairs(Players:GetPlayers()) do
		local char = player.Character
		if char and char:FindFirstChild("HumanoidRootPart") and char:FindFirstChild("Head") then
			local charHrp = char.HumanoidRootPart :: BasePart
			local dist = (charHrp.Position - hrp.Position).Magnitude
			if dist < nearestDist then
				nearestDist = dist
				nearestChar = char
			end
		end
	end

	if nearestChar and neck and baseNeckC0 then
		local targetHead = nearestChar:FindFirstChild("Head") :: BasePart?
		if targetHead then
			local localPos = upperTorso.CFrame:PointToObjectSpace(targetHead.Position)
			local yaw = math.clamp(-math.atan2(localPos.X, localPos.Z) - math.pi, -math.rad(60), math.rad(60))
			local pitch = math.clamp(math.atan2(localPos.Y, -localPos.Z), -math.rad(25), math.rad(25))

			neck.C0 = baseNeckC0 * CFrame.Angles(pitch, yaw, 0)
		end
	elseif neck and baseNeckC0 then
		neck.C0 = baseNeckC0 * CFrame.Angles(breath * 0.5, 0, 0)
	end
end)
