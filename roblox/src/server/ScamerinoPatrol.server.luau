--!strict
-- Idle patrol; the mission helper can pause it before taking ownership of movement.
local PathfindingService = game:GetService("PathfindingService")
local modelInstance = workspace:WaitForChild("ScamerinoAlertinio", 15)
if not modelInstance or not modelInstance:IsA("Model") then
	return
end
local model = modelInstance :: Model
local humanoid = model:FindFirstChildOfClass("Humanoid")
local rootInstance = model:FindFirstChild("HumanoidRootPart")
if not humanoid or not rootInstance or not rootInstance:IsA("BasePart") then
	return
end
local root = rootInstance :: BasePart
local home = root.Position
local random = Random.new()
local revision = 0
local moving = false

local function paused(): boolean
	return model:GetAttribute("ScamerinoPatrolPaused") == true
end

model:GetAttributeChangedSignal("ScamerinoPatrolPaused"):Connect(function()
	revision += 1
	if paused() and moving then
		humanoid:MoveTo(root.Position)
	end
end)

local rayParams = RaycastParams.new()
rayParams.FilterType = Enum.RaycastFilterType.Exclude
rayParams.FilterDescendantsInstances = { model }
root:SetNetworkOwner(nil)

while model:IsDescendantOf(workspace) and humanoid.Health > 0 do
	if paused() then
		task.wait(0.2)
		continue
	end
	local capturedRevision = revision
	local angle = random:NextNumber(0, 2 * math.pi)
	local radius = random:NextNumber(6, 12)
	local target = home + Vector3.new(math.cos(angle) * radius, 0, math.sin(angle) * radius)
	local ground = workspace:Raycast(target + Vector3.new(0, 12, 0), Vector3.new(0, -30, 0), rayParams)
	if not ground or ground.Normal.Y < 0.8 then
		task.wait(0.5)
		continue
	end
	local path = PathfindingService:CreatePath({
		AgentRadius = 3,
		AgentHeight = 7,
		AgentCanJump = false,
		WaypointSpacing = 4,
	})
	local ok = pcall(function()
		path:ComputeAsync(root.Position, ground.Position)
	end)
	if not ok or path.Status ~= Enum.PathStatus.Success then
		task.wait(1)
		continue
	end
	local blocked = false
	local currentWaypoint = 2
	local connection = path.Blocked:Connect(function(index)
		if index >= currentWaypoint then
			blocked = true
		end
	end)
	moving = true
	for index, waypoint in path:GetWaypoints() do
		if index == 1 then
			continue
		end
		currentWaypoint = index
		if paused() or capturedRevision ~= revision or blocked then
			break
		end
		humanoid:MoveTo(waypoint.Position)
		local deadline = os.clock() + 5
		repeat
			task.wait(0.1)
			local delta = root.Position - waypoint.Position
			if Vector3.new(delta.X, 0, delta.Z).Magnitude < 1 then
				break
			end
		until os.clock() >= deadline
			or paused()
			or capturedRevision ~= revision
			or blocked
			or not model:IsDescendantOf(workspace)
			or humanoid.Health <= 0
		if os.clock() >= deadline or paused() or capturedRevision ~= revision or blocked then
			break
		end
	end
	connection:Disconnect()
	-- Never overwrite a new movement owner's command after a pause/cancel.
	if capturedRevision == revision and not paused() then
		humanoid:MoveTo(root.Position)
	end
	moving = false
	task.wait(random:NextNumber(1.5, 3))
end
