--!strict
local RunService = game:GetService("RunService")

local NPCWalkAnimation = {}

-- Drive procedural walk animation for both R6 and R15 rigs.
-- C0 is replicated to all clients; Transform is local only.
-- Does not touch Neck/Waist, which are controlled by NPC head tracking.
function NPCWalkAnimation.start(model: Model): () -> ()
	local humanoid = model:FindFirstChildOfClass("Humanoid")
	local root = model:FindFirstChild("HumanoidRootPart") :: BasePart?
	if not humanoid or not root then
		return function() end
	end

	local isR6 = humanoid.RigType == Enum.HumanoidRigType.R6

	local joints: { [string]: Motor6D } = {}
	local rest: { [string]: CFrame } = {}

	local r15JointNames = {
		LeftHip = true,
		RightHip = true,
		LeftKnee = true,
		RightKnee = true,
		LeftAnkle = true,
		RightAnkle = true,
		LeftShoulder = true,
		RightShoulder = true,
		LeftElbow = true,
		RightElbow = true,
	}

	local r6JointNames = {
		["Left Hip"] = true,
		["Right Hip"] = true,
		["Left Shoulder"] = true,
		["Right Shoulder"] = true,
	}

	for _, instance in model:GetDescendants() do
		if instance:IsA("Motor6D") then
			if (isR6 and r6JointNames[instance.Name]) or (not isR6 and r15JointNames[instance.Name]) then
				joints[instance.Name] = instance
				rest[instance.Name] = instance.C0
			end
		end
	end

	local phase = 0
	local blend = 0
	local stopped = false
	local connection: RBXScriptConnection? = nil

	local function stop()
		if stopped then
			return
		end
		stopped = true
		if connection then
			connection:Disconnect()
		end
		for name, joint in joints do
			if joint.Parent then
				joint.C0 = rest[name]
			end
		end
	end

	local function rotateR15(name: string, angle: number)
		local joint = joints[name]
		if joint then
			joint.C0 = rest[name] * CFrame.Angles(angle, 0, 0)
		end
	end

	local function rotateR6(name: string, angle: number)
		local joint = joints[name]
		if joint then
			joint.C0 = rest[name] * CFrame.Angles(0, 0, angle)
		end
	end

	connection = RunService.Heartbeat:Connect(function(dt)
		if not model:IsDescendantOf(workspace) or humanoid.Health <= 0 then
			stop()
			return
		end

		local v = root.AssemblyLinearVelocity
		local speed = Vector3.new(v.X, 0, v.Z).Magnitude
		local walking = speed > 0.35 and humanoid.FloorMaterial ~= Enum.Material.Air
		local targetBlend = if walking then math.clamp(speed / 6, 0, 1) else 0
		blend += (targetBlend - blend) * (1 - math.exp(-dt * 14))

		if walking then
			-- Synchronize cadence with ground velocity (stride of ~2.4 studs) to prevent foot sliding/skating
			local strideLength = 2.4
			local stepFrequency = (speed / strideLength) * math.pi
			phase += dt * stepFrequency
		end

		local swing = math.sin(phase)

		if isR6 then
			local legAngle = swing * 0.70 * blend
			local armAngle = swing * 0.50 * blend

			-- In R6 coordinate frame, Z rotation drives forward/backward pitch:
			-- Left Hip: -legAngle is forward
			-- Right Hip: -legAngle is backward (alternating)
			rotateR6("Left Hip", -legAngle)
			rotateR6("Right Hip", -legAngle)

			-- Opposite arm swing: Left Leg forward -> Right Arm forward
			rotateR6("Right Shoulder", armAngle)
			rotateR6("Left Shoulder", armAngle)
		else
			-- R15 joints
			rotateR15("LeftHip", swing * 0.48 * blend)
			rotateR15("RightHip", -swing * 0.48 * blend)
			rotateR15("LeftKnee", math.max(0, -swing) * 0.70 * blend)
			rotateR15("RightKnee", math.max(0, swing) * 0.70 * blend)
			rotateR15("LeftAnkle", -math.max(0, -swing) * 0.20 * blend)
			rotateR15("RightAnkle", -math.max(0, swing) * 0.20 * blend)
			rotateR15("LeftShoulder", -swing * 0.30 * blend)
			rotateR15("RightShoulder", swing * 0.30 * blend)
			rotateR15("LeftElbow", -0.12 * blend)
			rotateR15("RightElbow", -0.12 * blend)
		end
	end)

	return stop
end

return NPCWalkAnimation
