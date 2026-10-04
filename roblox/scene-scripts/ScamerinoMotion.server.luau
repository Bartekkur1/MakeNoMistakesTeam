--!strict
-- Embedded in the exported model. Server drives replicated Motor6D.C0.
local RunService = game:GetService("RunService")
local model = script.Parent :: Model
local humanoid = model:WaitForChild("Humanoid") :: Humanoid
local root = model:WaitForChild("HumanoidRootPart") :: BasePart
local torso = model:WaitForChild("Torso") :: BasePart
local names = {"Left Hip", "Right Hip", "Left Shoulder", "Right Shoulder"}
local motors: {Motor6D} = {}
local rests: {CFrame} = {}
for _, name in names do
	local motor = torso:WaitForChild(name) :: Motor6D
	table.insert(motors, motor)
	table.insert(rests, motor.C0)
end
root:SetNetworkOwner(nil)
local phase = 0
local blend = 0
local connection: RBXScriptConnection?
connection = RunService.Heartbeat:Connect(function(dt)
	if not model:IsDescendantOf(workspace) or humanoid.Health <= 0 then
		if connection then connection:Disconnect() end
		for i, motor in motors do motor.C0 = rests[i] end
		return
	end
	local velocity = root.AssemblyLinearVelocity
	local speed = Vector3.new(velocity.X, 0, velocity.Z).Magnitude
	local walking = speed > 0.2 and humanoid.FloorMaterial ~= Enum.Material.Air
	local goal = if walking then 1 else 0
	blend += (goal - blend) * math.min(dt * 10, 1)
	if walking then phase += dt * 2 * math.pi / 0.95 end
	local swing = math.sin(phase) * blend
	motors[1].C0 = rests[1] * CFrame.Angles(swing * 0.40, 0, 0)
	motors[2].C0 = rests[2] * CFrame.Angles(-swing * 0.40, 0, 0)
	motors[3].C0 = rests[3] * CFrame.Angles(-swing * 0.14, 0, 0)
	motors[4].C0 = rests[4] * CFrame.Angles(swing * 0.14, 0, 0)
end)

