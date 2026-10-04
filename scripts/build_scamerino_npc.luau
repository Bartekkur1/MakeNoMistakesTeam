--[=[
    ScamerinoAlertinio NPC Builder & Setup
    HackYeah 2026 - Defence Track - MakeNoMistakesTeam

    Ten skrypt automatycznie buduje i konfiguruje kompletny model NPC Scamerino Alertinio
    w Roblox Studio:
    - Zaokrąglony model 3D (MeshParts) bez zniekształceń
    - Płetwa grzbietowa (Dorsal Fin) rekina
    - Złota Lupa Śledcza z listem phishingowym
    - Kogut/Syrena alarmowa z aktywnym PointLight
    - Zbalansowane złącza Motor6D (R6) z zerowym dryfem
    - Tabliczka StatusBadge (BillboardGui)
    - ProximityPrompt [E] do interakcji
--]=]

local GeometryService = game:GetService("GeometryService")
local ServerScriptService = game:GetService("ServerScriptService")
local ServerStorage = game:GetService("ServerStorage")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local StarterGui = game:GetService("StarterGui")

local function buildScamerino(spawnPosition)
    spawnPosition = spawnPosition or Vector3.new(0, 2.3, -10)

    -- Usuń ewentualny stary model
    local old = workspace:FindFirstChild("ScamerinoAlertinio")
    if old then old:Destroy() end

    local npc = Instance.new("Model")
    npc.Name = "ScamerinoAlertinio"

    -- 1. HumanoidRootPart
    local hrp = Instance.new("Part")
    hrp.Name = "HumanoidRootPart"
    hrp.Size = Vector3.new(2, 2, 1)
    hrp.Transparency = 1
    hrp.CanCollide = false
    hrp.Anchored = true
    hrp.CFrame = CFrame.new(spawnPosition) * CFrame.Angles(0, math.pi, 0)
    hrp.Parent = npc
    npc.PrimaryPart = hrp

    -- 2. Humanoid & Animator
    local humanoid = Instance.new("Humanoid")
    humanoid.Name = "Humanoid"
    humanoid.MaxHealth = 100
    humanoid.Health = 100
    humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
    humanoid.Parent = npc

    local animator = Instance.new("Animator")
    animator.Name = "Animator"
    animator.Parent = humanoid

    -- 3. Siatki 3D (MeshParts)
    local function createMeshPart(name, meshId, textureId, size, cf)
        local mp = Instance.new("MeshPart")
        mp.Name = name
        mp.MeshId = meshId
        mp.TextureID = textureId
        mp.Size = size
        mp.CanCollide = false
        mp.Anchored = false
        mp.CFrame = cf
        mp.Parent = npc
        return mp
    end

    local baseCF = hrp.CFrame

    local torso = createMeshPart(
        "Torso",
        "rbxassetid://130674858699085",
        "rbxassetid://92517656171626",
        Vector3.new(2.12, 2.03, 1.40),
        baseCF
    )

    -- Przycięcie rogów z tyłu tułowia (GeometryService)
    local cutter = Instance.new("Part")
    cutter.Size = Vector3.new(6.0, 4.0, 2.5)
    cutter.CFrame = torso.CFrame * CFrame.new(0, 0.6, 1.2)
    local pcallSuccess, trimmedParts = pcall(function()
        return GeometryService:SubtractAsync(torso, {cutter})
    end)
    cutter:Destroy()
    if pcallSuccess and trimmedParts and #trimmedParts > 0 then
        local newTorso = trimmedParts[1]
        newTorso.Name = "Torso"
        newTorso.CanCollide = false
        newTorso.Anchored = false
        newTorso.Parent = npc
        torso:Destroy()
        torso = newTorso
    end

    local head = createMeshPart(
        "Head",
        "rbxassetid://92948738219699",
        "rbxassetid://112841488166381",
        Vector3.new(1.65, 1.99, 1.93),
        torso.CFrame * CFrame.new(0, 1.45, 0.08)
    )

    local leftArm = createMeshPart(
        "Left Arm",
        "rbxassetid://83405766837163",
        "rbxassetid://86251401114157",
        Vector3.new(1.17, 2.29, 1.08),
        torso.CFrame * CFrame.new(-1.52, 0.12, 0.05)
    )

    local rightArm = createMeshPart(
        "Right Arm",
        "rbxassetid://134914431095109",
        "rbxassetid://117023892615121",
        Vector3.new(1.16, 2.29, 1.08),
        torso.CFrame * CFrame.new(1.52, 0.12, 0.05)
    )

    local leftLeg = createMeshPart(
        "Left Leg",
        "rbxassetid://138544958935097",
        "rbxassetid://120577222937175",
        Vector3.new(1.00, 1.53, 1.33),
        torso.CFrame * CFrame.new(-0.62, -1.38, 0.05)
    )

    local rightLeg = createMeshPart(
        "Right Leg",
        "rbxassetid://82853907992049",
        "rbxassetid://126536200792814",
        Vector3.new(1.00, 1.53, 1.34),
        torso.CFrame * CFrame.new(0.62, -1.38, 0.05)
    )

    -- 4. Płetwa Grzbietowa (Dorsal Fin)
    local dorsalFin = Instance.new("Part")
    dorsalFin.Name = "DorsalFin"
    dorsalFin.Size = Vector3.new(0.4, 2.2, 1.8)
    dorsalFin.Color = Color3.fromRGB(15, 95, 210)
    dorsalFin.Material = Enum.Material.SmoothPlastic
    dorsalFin.CanCollide = false
    dorsalFin.Anchored = false
    dorsalFin.CFrame = torso.CFrame * CFrame.new(0, 0.8, 0.75) * CFrame.Angles(math.rad(20), 0, math.pi)

    local finMesh = Instance.new("SpecialMesh")
    finMesh.MeshType = Enum.MeshType.Wedge
    finMesh.Parent = dorsalFin
    dorsalFin.Parent = npc

    local finWeld = Instance.new("WeldConstraint")
    finWeld.Part0 = torso
    finWeld.Part1 = dorsalFin
    finWeld.Parent = torso

    -- 5. Lupa Śledcza (Magnifying Glass)
    local toolModel = Instance.new("Model")
    toolModel.Name = "MagnifyingGlass"

    local handle = Instance.new("Part")
    handle.Name = "Handle"
    handle.Size = Vector3.new(0.2, 1.2, 0.2)
    handle.Material = Enum.Material.SmoothPlastic
    handle.Color = Color3.fromRGB(35, 35, 40)
    handle.CanCollide = false
    handle.Anchored = false
    handle.CFrame = leftArm.CFrame * CFrame.new(0.25, -0.6, 0.8) * CFrame.Angles(math.rad(45), math.rad(15), math.rad(-15))
    handle.Parent = toolModel

    local rim = Instance.new("Part")
    rim.Name = "Rim"
    rim.Shape = Enum.PartType.Cylinder
    rim.Size = Vector3.new(0.18, 1.6, 1.6)
    rim.Material = Enum.Material.Metal
    rim.Color = Color3.fromRGB(255, 195, 25)
    rim.CanCollide = false
    rim.Anchored = false
    rim.CFrame = handle.CFrame * CFrame.new(0, 1.0, 0) * CFrame.Angles(0, 0, math.pi/2)
    rim.Parent = toolModel

    local lens = Instance.new("Part")
    lens.Name = "Lens"
    lens.Shape = Enum.PartType.Cylinder
    lens.Size = Vector3.new(0.08, 1.4, 1.4)
    lens.Material = Enum.Material.Glass
    lens.Transparency = 0.55
    lens.Color = Color3.fromRGB(210, 235, 255)
    lens.CanCollide = false
    lens.Anchored = false
    lens.CFrame = rim.CFrame
    lens.Parent = toolModel

    local hook = Instance.new("Part")
    hook.Name = "Hook"
    hook.Size = Vector3.new(0.08, 0.45, 0.08)
    hook.Material = Enum.Material.Metal
    hook.Color = Color3.fromRGB(235, 30, 45)
    hook.CanCollide = false
    hook.Anchored = false
    hook.CFrame = rim.CFrame * CFrame.new(0, 0, 0.08) * CFrame.Angles(0, 0, 0.25)
    hook.Parent = toolModel

    local env = Instance.new("Part")
    env.Name = "Envelope"
    env.Size = Vector3.new(0.65, 0.45, 0.05)
    env.Material = Enum.Material.SmoothPlastic
    env.Color = Color3.fromRGB(250, 250, 250)
    env.CanCollide = false
    env.Anchored = false
    env.CFrame = hook.CFrame * CFrame.new(0, -0.18, 0.05) * CFrame.Angles(0.1, 0.2, -0.1)
    env.Parent = toolModel

    local function weld(p0, p1)
        local w = Instance.new("WeldConstraint")
        w.Part0 = p0
        w.Part1 = p1
        w.Parent = p0
    end
    weld(handle, rim)
    weld(rim, lens)
    weld(rim, hook)
    weld(hook, env)
    weld(leftArm, handle)
    toolModel.Parent = npc

    -- 6. Motor6D Złącza (Zero-drift)
    local function addMotor(name, p0, p1)
        local m = Instance.new("Motor6D")
        m.Name = name
        m.Part0 = p0
        m.Part1 = p1
        m.C0 = p0.CFrame:ToObjectSpace(p1.CFrame)
        m.C1 = CFrame.new()
        m.Parent = p0
        return m
    end

    addMotor("RootJoint", hrp, torso)
    addMotor("Neck", torso, head)
    addMotor("Left Shoulder", torso, leftArm)
    addMotor("Right Shoulder", torso, rightArm)
    addMotor("Left Hip", torso, leftLeg)
    addMotor("Right Hip", torso, rightLeg)

    -- 7. Efekty głowy (Światło i Dźwięki)
    local sirenLight = Instance.new("PointLight")
    sirenLight.Name = "SirenLight"
    sirenLight.Color = Color3.fromRGB(255, 130, 20)
    sirenLight.Brightness = 3.5
    sirenLight.Range = 16
    sirenLight.Shadows = true
    sirenLight.Parent = head

    local function addSound(name, id, vol)
        local s = Instance.new("Sound")
        s.Name = name
        s.SoundId = id
        s.Volume = vol or 1
        s.Parent = head
    end
    addSound("GreetSound", "rbxassetid://9116395089", 0.7)
    addSound("AlertSound", "rbxassetid://9119661709", 1.0)
    addSound("WinSound", "rbxassetid://9116394545", 0.9)
    addSound("SnapSound", "rbxassetid://9119056795", 0.8)

    -- 8. StatusBadge & ProximityPrompt
    local bb = Instance.new("BillboardGui")
    bb.Name = "StatusBadge"
    bb.Size = UDim2.new(5.5, 0, 1.8, 0)
    bb.StudsOffset = Vector3.new(0, 2.4, 0)
    bb.AlwaysOnTop = true
    bb.MaxDistance = 50
    bb.Parent = head

    local frame = Instance.new("Frame")
    frame.Size = UDim2.new(1, 0, 1, 0)
    frame.BackgroundColor3 = Color3.fromRGB(12, 28, 68)
    frame.BackgroundTransparency = 0.25
    frame.BorderSizePixel = 0
    frame.Parent = bb
    Instance.new("UICorner", frame).CornerRadius = UDim.new(0, 12)
    local stroke = Instance.new("UIStroke", frame)
    stroke.Color = Color3.fromRGB(255, 190, 25)
    stroke.Thickness = 2.5

    local title = Instance.new("TextLabel", frame)
    title.Size = UDim2.new(1, 0, 0.52, 0)
    title.Position = UDim2.new(0, 0, 0.05, 0)
    title.BackgroundTransparency = 1
    title.Font = Enum.Font.FredokaOne
    title.Text = "🛡️ SCAMERINO ALERTINIO"
    title.TextColor3 = Color3.fromRGB(255, 220, 60)
    title.TextScaled = true

    local subtitle = Instance.new("TextLabel", frame)
    subtitle.Size = UDim2.new(1, 0, 0.38, 0)
    subtitle.Position = UDim2.new(0, 0, 0.54, 0)
    subtitle.BackgroundTransparency = 1
    subtitle.Font = Enum.Font.GothamMedium
    subtitle.Text = "Cyber-Pomocnik | [ E ] Porozmawiaj"
    subtitle.TextColor3 = Color3.fromRGB(230, 240, 255)
    subtitle.TextScaled = true

    local prompt = Instance.new("ProximityPrompt", torso)
    prompt.Name = "ChatPrompt"
    prompt.ActionText = "Porozmawiaj"
    prompt.ObjectText = "Scamerino Alertinio"
    prompt.KeyboardKeyCode = Enum.KeyCode.E
    prompt.GamepadKeyCode = Enum.KeyCode.ButtonX
    prompt.HoldDuration = 0.1
    prompt.MaxActivationDistance = 14
    prompt.RequiresLineOfSight = false

    npc.Parent = workspace
    return npc
end

return buildScamerino
