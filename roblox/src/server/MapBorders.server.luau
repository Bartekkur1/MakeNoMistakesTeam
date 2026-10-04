--!strict
-- MapBorders.server.luau
-- Ensures invisible boundary walls exist around the ground object to restrict the playable area.

local Workspace = game:GetService("Workspace")

local function ensureMapBorders()
	if Workspace:FindFirstChild("MapBorders") then
		return
	end

	local ground = Workspace:FindFirstChild("ground", true)
	if not ground or not ground:IsA("BasePart") then
		warn("[MapBorders] Could not find 'ground' BasePart in Workspace")
		return
	end

	local bordersFolder = Instance.new("Folder")
	bordersFolder.Name = "MapBorders"

	local gSize = ground.Size
	local gPos = ground.Position

	local wallHeight = 80
	local wallThickness = 6
	local halfX = gSize.X / 2
	local halfZ = gSize.Z / 2
	local centerY = gPos.Y + (wallHeight / 2)

	local walls = {
		{
			name = "NorthWall",
			size = Vector3.new(gSize.X + (wallThickness * 2), wallHeight, wallThickness),
			pos = Vector3.new(gPos.X, centerY, gPos.Z - halfZ),
		},
		{
			name = "SouthWall",
			size = Vector3.new(gSize.X + (wallThickness * 2), wallHeight, wallThickness),
			pos = Vector3.new(gPos.X, centerY, gPos.Z + halfZ),
		},
		{
			name = "WestWall",
			size = Vector3.new(wallThickness, wallHeight, gSize.Z + (wallThickness * 2)),
			pos = Vector3.new(gPos.X - halfX, centerY, gPos.Z),
		},
		{
			name = "EastWall",
			size = Vector3.new(wallThickness, wallHeight, gSize.Z + (wallThickness * 2)),
			pos = Vector3.new(gPos.X + halfX, centerY, gPos.Z),
		},
	}

	for _, wallData in ipairs(walls) do
		local wall = Instance.new("Part")
		wall.Name = wallData.name
		wall.Size = wallData.size
		wall.Position = wallData.pos
		wall.Anchored = true
		wall.CanCollide = true
		wall.Transparency = 1
		wall.CastShadow = false
		wall.Parent = bordersFolder
	end

	bordersFolder.Parent = Workspace
	print("[MapBorders] Created invisible boundary walls around ground")
end

ensureMapBorders()
