--!strict
local RunService = game:GetService("RunService")

local NPCWalkAnimation = {}

-- Drive the existing R15 joints. C0 is replicated; Transform is not.
-- Does not touch Neck/Waist, which are controlled by the NPC's head tracking.
function NPCWalkAnimation.start(model: Model): () -> ()
	local humanoid = model:FindFirstChildOfClass("Humanoid")
	local root = model:FindFirstChild("HumanoidRootPart") :: BasePart?
	if not humanoid or not root then
		return function() end
	end
	local joints: { [string]: Motor6D } = {}
	local rest: { [string]: CFrame } = {}
	local animated: { [string]: boolean } = {
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
		["Left Hip"] = true,
		["Right Hip"] = true,
		["Left Shoulder"] = true,
		["Right Shoulder"] = true,
	}
	for _, instance in model:GetDescendants() do
		if instance:IsA("Motor6D") and animated[instance.Name] then
			joints[instance.Name] = instance
			rest[instance.Name] = instance.C0
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
	local function rotate(name: string, angle: number)
		local joint = joints[name]
		if joint then
			joint.C0 = rest[name] * CFrame.Angles(angle, 0, 0)
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
		local targetBlend = if walking then math.clamp(speed / 8, 0, 1) else 0
		blend += (targetBlend - blend) * (1 - math.exp(-dt * 12))
		if walking then
			phase += dt * math.clamp(speed / 4, 1, 3) * math.pi
		end
		local swing = math.sin(phase)
		rotate("LeftHip", swing * 0.48 * blend)
		rotate("RightHip", -swing * 0.48 * blend)
		rotate("LeftKnee", math.max(0, -swing) * 0.70 * blend)
		rotate("RightKnee", math.max(0, swing) * 0.70 * blend)
		rotate("LeftAnkle", -math.max(0, -swing) * 0.20 * blend)
		rotate("RightAnkle", -math.max(0, swing) * 0.20 * blend)
		rotate("LeftShoulder", -swing * 0.30 * blend)
		rotate("RightShoulder", swing * 0.30 * blend)
		rotate("LeftElbow", -0.12 * blend)
		rotate("RightElbow", -0.12 * blend)
		-- R6 limbs
		rotate("Left Hip", swing * 0.40 * blend)
		rotate("Right Hip", -swing * 0.40 * blend)
		rotate("Left Shoulder", -swing * 0.25 * blend)
		rotate("Right Shoulder", swing * 0.25 * blend)
	end)
	return stop
end

return NPCWalkAnimation
