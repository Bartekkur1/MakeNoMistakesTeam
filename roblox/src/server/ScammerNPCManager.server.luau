--!strict
local RunService = game:GetService("RunService")
local Players = game:GetService("Players")
local Chat = game:GetService("Chat")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local NPCNavigation = require(script.Parent:WaitForChild("NPCNavigation") :: ModuleScript)

local lobby = workspace:WaitForChild("MarketplaceLobby", 10) :: Instance?
local npc = lobby and (lobby:WaitForChild("ScammerNPC", 10) :: Model?)
if not npc then
	return
end

local hrp = npc:WaitForChild("HumanoidRootPart", 5) :: BasePart?
local upperTorso = npc:WaitForChild("UpperTorso", 5) :: BasePart?
local head = npc:WaitForChild("Head", 5) :: BasePart?
local lowerTorso = npc:WaitForChild("LowerTorso", 5) :: BasePart?
local humanoid = npc:FindFirstChildOfClass("Humanoid")

if not hrp or not upperTorso or not head or not lowerTorso or not humanoid then
	return
end

humanoid.DisplayName = "MatiBuilds"

-- Per D-03: Disable ProximityPrompt so interaction is triggered by proximity approach, not [E]
local prompt = hrp:FindFirstChildOfClass("ProximityPrompt")
if prompt then
	prompt.Enabled = false
end

local neck = (head:FindFirstChild("Neck") or upperTorso:FindFirstChild("Neck")) :: Motor6D?
local waist = (upperTorso:FindFirstChild("Waist") or lowerTorso:FindFirstChild("Waist")) :: Motor6D?

local baseNeckC0 = if neck then neck.C0 else CFrame.new()
local baseWaistC0 = if waist then waist.C0 else CFrame.new()

local arbiter = NPCNavigation.getDefaultArbiter()

-- Breathing & Head tracking
local currentTargetPlayer: Player? = nil
local clock = 0

RunService.Heartbeat:Connect(function(dt: number)
	clock += dt

	-- Gentle breathing
	local breath = math.sin(clock * 2.2) * 0.02
	local sway = math.cos(clock * 1.5) * 0.015

	if waist and baseWaistC0 then
		waist.C0 = baseWaistC0 * CFrame.Angles(breath * 0.5, sway, 0)
	end

	-- Head tracking towards current target player or nearest player
	local targetChar = if currentTargetPlayer then currentTargetPlayer.Character else nil
	if not targetChar then
		local nearestDist = NPCNavigation.NOTICE_DISTANCE
		for _, player in ipairs(Players:GetPlayers()) do
			local char = player.Character
			if char and char:FindFirstChild("HumanoidRootPart") and char:FindFirstChild("Head") then
				local charHrp = char.HumanoidRootPart :: BasePart
				local dist = (charHrp.Position - hrp.Position).Magnitude
				if dist < nearestDist then
					nearestDist = dist
					targetChar = char
				end
			end
		end
	end

	if targetChar and neck and baseNeckC0 then
		local targetHead = targetChar:FindFirstChild("Head") :: BasePart?
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

local function triggerBeginEncounter(player: Player, revision: number)
	local remotes = ReplicatedStorage:FindFirstChild("MissionRemotes")
	local bEvent = remotes and remotes:FindFirstChild("BeginEncounterEvent") :: BindableEvent?
	if bEvent then
		bEvent:Fire(player, revision)
	end
end

local function triggerCancelEncounter(player: Player)
	local remotes = ReplicatedStorage:FindFirstChild("MissionRemotes")
	local cEvent = remotes and remotes:FindFirstChild("CancelEncounterEvent") :: BindableEvent?
	if cEvent then
		cEvent:Fire(player)
	end
end

-- Patrol waypoints
local basePos = hrp.Position
local patrolPoints = {
	basePos + Vector3.new(0, 0, 0),
	basePos + Vector3.new(6, 0, -5),
	basePos + Vector3.new(-6, 0, -4),
	basePos + Vector3.new(0, 0, 6),
}
local currentPatrolIdx = 1

local isNavigating = false

task.spawn(function()
	while npc and npc.Parent do
		task.wait(0.5)

		-- Check for nearby candidate players within notice distance (28 studs)
		local bestCandidate: Player? = nil
		local bestDist = NPCNavigation.NOTICE_DISTANCE

		for _, player in ipairs(Players:GetPlayers()) do
			local char = player.Character
			local charHrp = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?
			if char and charHrp and charHrp.Parent then
				local dist = (charHrp.Position - hrp.Position).Magnitude
				if dist <= bestDist then
					bestDist = dist
					bestCandidate = player
				end
			end
		end

		if bestCandidate and not isNavigating then
			local claimSuccess = arbiter.tryClaim(bestCandidate)
			if claimSuccess then
				isNavigating = true
				currentTargetPlayer = bestCandidate
				local token = arbiter.getToken(bestCandidate)

				-- Walk to player with obstacle avoidance
				local navResult = NPCNavigation.walkToPlayer(
					npc,
					bestCandidate,
					{ stopDistance = NPCNavigation.STOP_DISTANCE, timeout = NPCNavigation.PATH_TIMEOUT },
					token
				)

				if navResult == "arrived" and not (token and token.isCancelled) then
					-- Turn to face player
					local targetChar = bestCandidate.Character
					local targetHrp = targetChar and targetChar:FindFirstChild("HumanoidRootPart") :: BasePart?
					if targetHrp then
						hrp.CFrame = CFrame.lookAt(
							hrp.Position,
							Vector3.new(targetHrp.Position.X, hrp.Position.Y, targetHrp.Position.Z)
						)
					end

					-- Emit single public shout bubble per D-09
					pcall(function()
						Chat:Chat(
							head,
							"Siemka! Masz super skin, widać że znasz się na grze :)",
							Enum.ChatColor.Green
						)
					end)

					-- Start simulated private chat encounter
					local revision = if token then token.revision else 1
					triggerBeginEncounter(bestCandidate, revision)

					-- Monitor distance and interaction state
					local interactionStartTime = os.clock()
					local gavePressureShout = false

					while bestCandidate and bestCandidate.Parent and arbiter.isOwner(bestCandidate) do
						task.wait(0.2)
						local char = bestCandidate.Character
						local cHrp = char and char:FindFirstChild("HumanoidRootPart") :: BasePart?

						if not char or not cHrp or not cHrp.Parent then
							break
						end

						local currentDist = (cHrp.Position - hrp.Position).Magnitude
						-- Distance break per D-11
						if currentDist > NPCNavigation.BREAK_DISTANCE then
							triggerCancelEncounter(bestCandidate)
							arbiter.releaseOwner(bestCandidate)
							break
						end

						-- Pressure shout if no response after FOLLOW_GRACE (5s) per D-10
						if
							not gavePressureShout and (os.clock() - interactionStartTime > NPCNavigation.FOLLOW_GRACE)
						then
							gavePressureShout = true
							pcall(function()
								Chat:Chat(
									head,
									"Zostało ostatnie miejsce w giveawayu Robuxów, zaraz przepada!",
									Enum.ChatColor.Green
								)
							end)
						end
					end
				else
					-- Path blocked or timeout
					arbiter.releaseOwner(bestCandidate)
				end

				currentTargetPlayer = nil
				isNavigating = false
			end
		elseif not isNavigating then
			-- Idle patrol
			local targetPoint = patrolPoints[currentPatrolIdx]
			humanoid:MoveTo(targetPoint)
			local reached = false
			local conn = humanoid.MoveToFinished:Connect(function()
				reached = true
			end)

			local waitTime = 0
			while not reached and waitTime < 4 do
				task.wait(0.2)
				waitTime += 0.2
			end
			conn:Disconnect()

			currentPatrolIdx = (currentPatrolIdx % #patrolPoints) + 1
			task.wait(math.random(2, 4))
		end
	end
end)
