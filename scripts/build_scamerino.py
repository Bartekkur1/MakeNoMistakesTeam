"""
Complete procedural generator for the Scamerino Alertinio character in Blender 5.x.
Creates all meshes, materials, armature, renders turnaround preview,
and exports .blend, .fbx, and .glb for Roblox Studio.
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector, Matrix, Euler

# ---------------------------------------------------------------------------
# Scene setup & Materials
# ---------------------------------------------------------------------------

def clean_scene():
    bpy.ops.wm.read_homefile(use_empty=True)
    for col in (bpy.data.meshes, bpy.data.materials, bpy.data.armatures, bpy.data.images, bpy.data.cameras, bpy.data.lights):
        for item in list(col):
            col.remove(item)

def create_material(name, base_color, metallic=0.0, roughness=0.35, emission=None, emission_strength=1.0, transmission=0.0, alpha=1.0):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
    
    bsdf.inputs['Base Color'].default_value = base_color
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    if 'Alpha' in bsdf.inputs:
        bsdf.inputs['Alpha'].default_value = alpha
    if 'Transmission Weight' in bsdf.inputs:
        bsdf.inputs['Transmission Weight'].default_value = transmission
    elif 'Transmission' in bsdf.inputs:
        bsdf.inputs['Transmission'].default_value = transmission
        
    if emission:
        if 'Emission Color' in bsdf.inputs:
            bsdf.inputs['Emission Color'].default_value = emission
            bsdf.inputs['Emission Strength'].default_value = emission_strength
        elif 'Emission' in bsdf.inputs:
            bsdf.inputs['Emission'].default_value = emission
            
    if alpha < 1.0 or transmission > 0.0:
        mat.blend_method = 'BLEND'
    return mat

def setup_materials():
    mats = {}
    # Saturated vibrant heroic cobalt blue
    mats['SharkBlue'] = create_material('Mat_SharkBlue', (0.015, 0.14, 0.76, 1.0), metallic=0.08, roughness=0.25)
    mats['SharkWhite'] = create_material('Mat_SharkWhite', (0.96, 0.97, 0.99, 1.0), metallic=0.0, roughness=0.22)
    mats['ArmorBlue'] = create_material('Mat_ArmorBlue', (0.012, 0.12, 0.72, 1.0), metallic=0.14, roughness=0.24)
    mats['ArmorDarkBlue'] = create_material('Mat_ArmorDarkBlue', (0.005, 0.05, 0.35, 1.0), metallic=0.10, roughness=0.32)
    mats['SilverMetal'] = create_material('Mat_SilverMetal', (0.90, 0.92, 0.95, 1.0), metallic=0.94, roughness=0.15)
    mats['Gold'] = create_material('Mat_Gold', (1.0, 0.72, 0.06, 1.0), metallic=0.92, roughness=0.18)
    mats['SirenAmber'] = create_material('Mat_SirenAmber', (1.0, 0.42, 0.0, 1.0), roughness=0.10, transmission=0.45, emission=(1.0, 0.46, 0.0, 1.0), emission_strength=5.5)
    mats['SirenGlow'] = create_material('Mat_SirenGlow', (1.0, 0.88, 0.15, 1.0), roughness=0.08, emission=(1.0, 0.88, 0.15, 1.0), emission_strength=12.0)
    mats['EyeBlack'] = create_material('Mat_EyeBlack', (0.015, 0.015, 0.02, 1.0), metallic=0.0, roughness=0.04)
    mats['EyeGlint'] = create_material('Mat_EyeGlint', (1.0, 1.0, 1.0, 1.0), metallic=0.0, roughness=0.04, emission=(1.0, 1.0, 1.0, 1.0), emission_strength=3.0)
    mats['MouthRed'] = create_material('Mat_MouthRed', (0.50, 0.05, 0.09, 1.0), metallic=0.0, roughness=0.35)
    mats['Tongue'] = create_material('Mat_Tongue', (0.95, 0.22, 0.35, 1.0), metallic=0.0, roughness=0.28)
    mats['HookRed'] = create_material('Mat_HookRed', (0.92, 0.04, 0.06, 1.0), metallic=0.88, roughness=0.18)
    mats['Envelope'] = create_material('Mat_Envelope', (0.97, 0.96, 0.94, 1.0), metallic=0.0, roughness=0.55)
    mats['EnvelopeLine'] = create_material('Mat_EnvelopeLine', (0.75, 0.74, 0.72, 1.0), metallic=0.0, roughness=0.5)
    mats['DarkHandle'] = create_material('Mat_DarkHandle', (0.05, 0.05, 0.06, 1.0), metallic=0.3, roughness=0.35)
    mats['Glass'] = create_material('Mat_Glass', (0.92, 0.96, 1.0, 1.0), roughness=0.04, transmission=0.94, alpha=0.32)
    return mats

def assign_mat(obj, mat):
    if not obj.data.materials:
        obj.data.materials.append(mat)
    else:
        obj.data.materials[0] = mat

def smooth_mesh(obj):
    for f in obj.data.polygons:
        f.use_smooth = True

def add_bevel(obj, width=0.02, segments=2):
    bev = obj.modifiers.new(name="Bevel", type='BEVEL')
    bev.width = width
    bev.segments = segments

def add_subsurf(obj, levels=1):
    sub = obj.modifiers.new(name="Subsurf", type='SUBSURF')
    sub.levels = levels
    sub.render_levels = levels

# ---------------------------------------------------------------------------
# Geometric Builders
# ---------------------------------------------------------------------------

def create_beveled_box(name, size, location, mat, bevel_w=0.02, bevel_s=2):
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign_mat(obj, mat)
    smooth_mesh(obj)
    if bevel_w > 0:
        add_bevel(obj, width=bevel_w, segments=bevel_s)
    return obj

def create_cylinder(name, radius, depth, location, rotation=(0,0,0), mat=None, vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, vertices=vertices, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    if mat:
        assign_mat(obj, mat)
    smooth_mesh(obj)
    return obj

def create_sphere(name, radius, location, scale=(1,1,1), mat=None, segments=32, rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, segments=segments, ring_count=rings, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if mat:
        assign_mat(obj, mat)
    smooth_mesh(obj)
    return obj

# ---------------------------------------------------------------------------
# Shark Head Builder
# ---------------------------------------------------------------------------

def build_shark_head(mats):
    """Builds the cartoon shark head, snout, dorsal fin, siren, eyes, mouth and teeth."""
    head_parts = []
    
    # 1. Main Shark Cranium (Dome & Back of Head)
    cranium = create_sphere("Head_Cranium", radius=0.29, location=(0, -0.04, 1.80),
                            scale=(1.0, 1.05, 1.08), mat=mats['SharkBlue'])
    head_parts.append(cranium)
    
    # 2. Upper Snout / Nose (Arched forward over the mouth)
    bm_snout = bmesh.new()
    # Loft nose from cranium forward to nose tip
    snout_layers = [
        # (y, z, x_rad, z_rad)
        (0.00, 1.82, 0.28, 0.24),
        (0.12, 1.83, 0.25, 0.20),
        (0.22, 1.83, 0.20, 0.16),
        (0.30, 1.82, 0.13, 0.11),
        (0.35, 1.81, 0.04, 0.04),
    ]
    prev_r = None
    for sy, sz, rx, rz in snout_layers:
        ring = []
        n_seg = 16
        for i in range(n_seg):
            ang = i * (2 * math.pi / n_seg)
            # Upper snout arc only (flatter at bottom for mouth)
            pt_z = sz + rz * math.sin(ang) if math.sin(ang) >= 0 else sz + (rz * 0.4) * math.sin(ang)
            pt_x = rx * math.cos(ang)
            ring.append(bm_snout.verts.new(Vector((pt_x, sy, pt_z))))
        if prev_r:
            for i in range(n_seg):
                bm_snout.faces.new([prev_r[i], prev_r[(i+1)%n_seg], ring[(i+1)%n_seg], ring[i]])
        prev_r = ring
    # Cap nose tip
    bm_snout.faces.new(prev_r)
    
    me_snout = bpy.data.meshes.new("SnoutMesh")
    bm_snout.to_mesh(me_snout)
    bm_snout.free()
    snout_obj = bpy.data.objects.new("Head_Snout", me_snout)
    bpy.context.collection.objects.link(snout_obj)
    assign_mat(snout_obj, mats['SharkBlue'])
    smooth_mesh(snout_obj)
    add_subsurf(snout_obj, levels=1)
    head_parts.append(snout_obj)
    
    # 3. White Lower Jaw / Underbelly (Smiling open mouth bottom)
    bm_jaw = bmesh.new()
    jaw_layers = [
        (0.00, 1.68, 0.26, 0.16),
        (0.10, 1.67, 0.22, 0.14),
        (0.18, 1.66, 0.17, 0.11),
        (0.25, 1.65, 0.10, 0.07),
    ]
    prev_j = None
    for jy, jz, rx, rz in jaw_layers:
        ring = []
        n_seg = 16
        for i in range(n_seg):
            ang = i * (2 * math.pi / n_seg)
            pt_z = jz + (rz * 0.3) * math.sin(ang) if math.sin(ang) >= 0 else jz + rz * math.sin(ang)
            pt_x = rx * math.cos(ang)
            ring.append(bm_jaw.verts.new(Vector((pt_x, jy, pt_z))))
        if prev_j:
            for i in range(n_seg):
                bm_jaw.faces.new([prev_j[i], prev_j[(i+1)%n_seg], ring[(i+1)%n_seg], ring[i]])
        prev_j = ring
    bm_jaw.faces.new(prev_j)
    
    me_jaw = bpy.data.meshes.new("JawMesh")
    bm_jaw.to_mesh(me_jaw)
    bm_jaw.free()
    jaw_obj = bpy.data.objects.new("Head_LowerJaw", me_jaw)
    bpy.context.collection.objects.link(jaw_obj)
    assign_mat(jaw_obj, mats['SharkWhite'])
    smooth_mesh(jaw_obj)
    add_subsurf(jaw_obj, levels=1)
    head_parts.append(jaw_obj)
    
    # 4. Wide Smiling Mouth Cavity (Dark Crimson interior)
    mouth_bg = create_sphere("Mouth_Cavity", radius=0.17, location=(0, 0.16, 1.73), scale=(1.2, 0.7, 0.55), mat=mats['MouthRed'])
    head_parts.append(mouth_bg)
    
    # Pink Tongue
    tongue = create_sphere("Mouth_Tongue", radius=0.09, location=(0, 0.17, 1.68), scale=(1.3, 0.8, 0.45), mat=mats['Tongue'])
    head_parts.append(tongue)
    
    # 5. Sharp White Triangular Shark Teeth (Visible in open smile!)
    # Upper Teeth (Pointing down)
    upper_tooth_angles = [-0.65, -0.38, -0.12, 0.12, 0.38, 0.65]
    for i, ang in enumerate(upper_tooth_angles):
        tx = 0.20 * math.sin(ang)
        ty = 0.15 + 0.14 * math.cos(ang)
        tz = 1.77
        tooth = create_cylinder(f"Tooth_Upper_{i}", radius=0.016, depth=0.045, location=(tx, ty, tz),
                                rotation=(math.pi + 0.25, 0, -ang), mat=mats['SharkWhite'], vertices=4)
        head_parts.append(tooth)
        
    # Lower Teeth (Pointing up)
    lower_tooth_angles = [-0.52, -0.26, 0.0, 0.26, 0.52]
    for i, ang in enumerate(lower_tooth_angles):
        tx = 0.16 * math.sin(ang)
        ty = 0.14 + 0.12 * math.cos(ang)
        tz = 1.69
        tooth = create_cylinder(f"Tooth_Lower_{i}", radius=0.014, depth=0.038, location=(tx, ty, tz),
                                rotation=(0.2, 0, ang), mat=mats['SharkWhite'], vertices=4)
        head_parts.append(tooth)
        
    # 6. Big Expressive Cartoon Eyes (Positioned prominently on cheeks)
    for side, x_sign in [("Left", -1), ("Right", 1)]:
        eye_pos = (x_sign * 0.19, 0.18, 1.88)
        
        # Sclera (White eye sphere)
        eye_white = create_sphere(f"Eye_{side}_White", radius=0.095, location=eye_pos, scale=(0.85, 1.0, 1.1), mat=mats['SharkWhite'])
        eye_white.rotation_euler = (0.05, 0, x_sign * 0.15)
        head_parts.append(eye_white)
        
        # Pupil (Glossy Black cartoon pupil facing forward/slightly up)
        pupil_pos = (x_sign * 0.195, 0.265, 1.89)
        pupil = create_sphere(f"Eye_{side}_Pupil", radius=0.058, location=pupil_pos, scale=(0.7, 0.35, 0.8), mat=mats['EyeBlack'])
        head_parts.append(pupil)
        
        # Specular Glint (Catchlight highlight)
        glint_pos = (x_sign * 0.185, 0.282, 1.915)
        glint = create_sphere(f"Eye_{side}_Glint", radius=0.020, location=glint_pos, mat=mats['EyeGlint'])
        head_parts.append(glint)
        
        # Eyebrow / Eyelid Arc (Blue shark brow ridge curving directly over the eye)
        brow = create_cylinder(f"Eye_{side}_Brow", radius=0.018, depth=0.18, location=(x_sign * 0.18, 0.21, 1.95),
                               rotation=(0.15, 0, x_sign * 0.18), mat=mats['SharkBlue'])
        add_bevel(brow, width=0.006)
        head_parts.append(brow)

    # 7. Dorsal Fin (Iconic sweeping shark fin on top/back)
    bm_fin = bmesh.new()
    profiles = [
        (0.00, -0.05, 0.30, 0.08),
        (0.08, -0.10, 0.25, 0.06),
        (0.16, -0.15, 0.20, 0.045),
        (0.25, -0.21, 0.14, 0.03),
        (0.33, -0.27, 0.07, 0.018),
        (0.38, -0.31, 0.02, 0.006),
    ]
    prev_ring = None
    for pz, py, plen, pthick in profiles:
        pts = [
            Vector((0, py + plen*0.5, pz)),
            Vector((pthick*0.5, py + plen*0.1, pz)),
            Vector((pthick*0.3, py - plen*0.4, pz)),
            Vector((0, py - plen*0.5, pz)),
            Vector((-pthick*0.3, py - plen*0.4, pz)),
            Vector((-pthick*0.5, py + plen*0.1, pz)),
        ]
        curr_verts = [bm_fin.verts.new(pt) for pt in pts]
        if prev_ring is not None:
            n = len(curr_verts)
            for i in range(n):
                bm_fin.faces.new([prev_ring[i], prev_ring[(i+1)%n], curr_verts[(i+1)%n], curr_verts[i]])
        else:
            bm_fin.faces.new(curr_verts[::-1])
        prev_ring = curr_verts
    bm_fin.faces.new(prev_ring)
    
    me_fin = bpy.data.meshes.new("FinMesh")
    bm_fin.to_mesh(me_fin)
    bm_fin.free()
    fin_obj = bpy.data.objects.new("Head_DorsalFin", me_fin)
    fin_obj.location = (0, -0.06, 2.02)
    bpy.context.collection.objects.link(fin_obj)
    assign_mat(fin_obj, mats['SharkBlue'])
    smooth_mesh(fin_obj)
    add_subsurf(fin_obj, levels=1)
    head_parts.append(fin_obj)

    # 8. Siren / Emergency Beacon Light on Head
    siren_base = create_cylinder("Siren_Base", radius=0.075, depth=0.035, location=(0, 0.05, 2.08), mat=mats['SilverMetal'])
    add_bevel(siren_base, width=0.008, segments=2)
    head_parts.append(siren_base)
    
    siren_dome = create_cylinder("Siren_Dome", radius=0.065, depth=0.10, location=(0, 0.05, 2.15), mat=mats['SirenAmber'])
    add_bevel(siren_dome, width=0.018, segments=3)
    head_parts.append(siren_dome)
    
    siren_bulb = create_sphere("Siren_Bulb", radius=0.040, location=(0, 0.05, 2.15), mat=mats['SirenGlow'])
    head_parts.append(siren_bulb)

    # 9. Gills (3 dark blue slits per cheek)
    for side, x_sign in [("Left", -1), ("Right", 1)]:
        for g in range(3):
            gy = -0.04 - g * 0.045
            gz = 1.74 + g * 0.035
            gill = create_cylinder(f"Gill_{side}_{g}", radius=0.008, depth=0.09,
                                   location=(x_sign * 0.28, gy, gz),
                                   rotation=(0.3, x_sign * 0.35, x_sign * 0.2), mat=mats['ArmorDarkBlue'])
            head_parts.append(gill)

    return head_parts

# ---------------------------------------------------------------------------
# Upper Torso & Chest Shield Builder
# ---------------------------------------------------------------------------

def build_upper_torso(mats):
    """Builds UpperTorso robotic chassis, collar, chest shield, rivets, and golden padlock."""
    torso_parts = []
    
    # 1. Main Chest Body (Cybernetic block)
    chest_body = create_beveled_box("UpperTorso_Chassis", size=(0.56, 0.36, 0.44), location=(0, 0.02, 1.32),
                                    mat=mats['ArmorBlue'], bevel_w=0.035, bevel_s=3)
    torso_parts.append(chest_body)
    
    # White Collar Rim around neck
    collar = create_cylinder("Torso_Collar", radius=0.22, depth=0.06, location=(0, 0.03, 1.54), mat=mats['SharkWhite'])
    add_bevel(collar, width=0.015, segments=2)
    torso_parts.append(collar)
    
    # White Shoulder joint mounts
    for side, x_sign in [("Left", -1), ("Right", 1)]:
        smount = create_cylinder(f"Shoulder_Mount_{side}", radius=0.10, depth=0.12,
                                 location=(x_sign * 0.28, 0.02, 1.38), rotation=(0, math.pi/2, 0), mat=mats['SharkWhite'])
        add_bevel(smount, width=0.012)
        torso_parts.append(smount)

    # 2. Chest Security Shield (Heater shield shape)
    # Build shield face mesh
    bm_shield = bmesh.new()
    shield_pts = [
        Vector((-0.24, 0.0, 0.18)),  # 0 Top left
        Vector((0.0, 0.0, 0.21)),    # 1 Top center
        Vector((0.24, 0.0, 0.18)),   # 2 Top right
        Vector((0.26, 0.0, 0.02)),   # 3 Mid right
        Vector((0.15, 0.0, -0.16)),  # 4 Lower right
        Vector((0.0, 0.0, -0.25)),   # 5 Bottom point
        Vector((-0.15, 0.0, -0.16)), # 6 Lower left
        Vector((-0.26, 0.0, 0.02)),  # 7 Mid left
    ]
    verts_f = [bm_shield.verts.new(p + Vector((0, 0.02, 0))) for p in shield_pts]
    verts_b = [bm_shield.verts.new(p + Vector((0, -0.02, 0))) for p in shield_pts]
    
    # Front face
    bm_shield.faces.new(verts_f)
    # Back face
    bm_shield.faces.new(verts_b[::-1])
    # Rim faces
    n = len(shield_pts)
    for i in range(n):
        bm_shield.faces.new([verts_f[i], verts_f[(i+1)%n], verts_b[(i+1)%n], verts_b[i]])
        
    me_shield = bpy.data.meshes.new("ShieldPlateMesh")
    bm_shield.to_mesh(me_shield)
    bm_shield.free()
    
    shield_plate = bpy.data.objects.new("Chest_Shield_Plate", me_shield)
    shield_plate.location = (0, 0.20, 1.30)
    bpy.context.collection.objects.link(shield_plate)
    assign_mat(shield_plate, mats['ArmorBlue'])
    smooth_mesh(shield_plate)
    add_bevel(shield_plate, width=0.008, segments=2)
    torso_parts.append(shield_plate)
    
    # 3. Silver Shield Frame / Border
    bm_rim = bmesh.new()
    # Thicken outline to make outer silver rim
    outer_pts = [p * 1.12 for p in shield_pts]
    inner_pts = [p * 0.96 for p in shield_pts]
    
    v_out = [bm_rim.verts.new(p + Vector((0, 0.035, 0))) for p in outer_pts]
    v_in  = [bm_rim.verts.new(p + Vector((0, 0.035, 0))) for p in inner_pts]
    v_out_b = [bm_rim.verts.new(p + Vector((0, 0.00, 0))) for p in outer_pts]
    
    for i in range(n):
        # Front face of rim
        bm_rim.faces.new([v_out[i], v_out[(i+1)%n], v_in[(i+1)%n], v_in[i]])
        # Side face
        bm_rim.faces.new([v_out_b[i], v_out_b[(i+1)%n], v_out[(i+1)%n], v_out[i]])
        
    me_rim = bpy.data.meshes.new("ShieldRimMesh")
    bm_rim.to_mesh(me_rim)
    bm_rim.free()
    
    shield_rim = bpy.data.objects.new("Chest_Shield_Rim", me_rim)
    shield_rim.location = (0, 0.20, 1.30)
    bpy.context.collection.objects.link(shield_rim)
    assign_mat(shield_rim, mats['SilverMetal'])
    smooth_mesh(shield_rim)
    add_bevel(shield_rim, width=0.006, segments=2)
    torso_parts.append(shield_rim)
    
    # 4. Shield Rivets (6 silver metallic studs along the rim)
    rivet_coords = [
        (-0.21, 0.16), (0.21, 0.16),
        (-0.24, 0.02), (0.24, 0.02),
        (-0.13, -0.14), (0.13, -0.14)
    ]
    for idx, (rx, rz) in enumerate(rivet_coords):
        rivet = create_sphere(f"Shield_Rivet_{idx}", radius=0.015, location=(rx, 0.235, 1.30 + rz),
                              scale=(1.0, 0.4, 1.0), mat=mats['SilverMetal'])
        torso_parts.append(rivet)

    # 5. Golden Padlock Emblem on Chest
    # Padlock Body
    lock_body = create_beveled_box("Padlock_Body", size=(0.14, 0.045, 0.13), location=(0, 0.23, 1.25),
                                  mat=mats['Gold'], bevel_w=0.012, bevel_s=3)
    torso_parts.append(lock_body)
    
    # Padlock Shackle (Curved U-loop)
    bm_shackle = bmesh.new()
    shackle_curve_pts = []
    # Semi-circle on top of lock
    r_shackle = 0.045
    for a in range(13):
        ang = a * (math.pi / 12)
        shackle_curve_pts.append(Vector((r_shackle * math.cos(ang), 0, 0.065 + r_shackle * math.sin(ang))))
    # Straight legs going into lock
    shackle_curve_pts.insert(0, Vector((-r_shackle, 0, 0.02)))
    shackle_curve_pts.append(Vector((r_shackle, 0, 0.02)))
    
    # Create tube along curve
    prev_verts = None
    for pt in shackle_curve_pts:
        ring = []
        n_circ = 8
        for k in range(n_circ):
            kang = k * (2 * math.pi / n_circ)
            # Tube radius 0.011
            offset = Vector((0.011 * math.cos(kang), 0.011 * math.sin(kang), 0))
            ring.append(bm_shackle.verts.new(pt + offset))
        if prev_verts:
            for k in range(n_circ):
                bm_shackle.faces.new([prev_verts[k], prev_verts[(k+1)%n_circ], ring[(k+1)%n_circ], ring[k]])
        prev_verts = ring
    
    me_shackle = bpy.data.meshes.new("LockShackleMesh")
    bm_shackle.to_mesh(me_shackle)
    bm_shackle.free()
    
    lock_shackle = bpy.data.objects.new("Padlock_Shackle", me_shackle)
    lock_shackle.location = (0, 0.23, 1.25)
    bpy.context.collection.objects.link(lock_shackle)
    assign_mat(lock_shackle, mats['Gold'])
    smooth_mesh(lock_shackle)
    torso_parts.append(lock_shackle)
    
    # Keyhole (Dark indentation on lock)
    keyhole_top = create_cylinder("Padlock_Keyhole_Top", radius=0.014, depth=0.01, location=(0, 0.254, 1.265),
                                  rotation=(math.pi/2, 0, 0), mat=mats['EyeBlack'])
    torso_parts.append(keyhole_top)
    keyhole_bot = create_beveled_box("Padlock_Keyhole_Bot", size=(0.012, 0.01, 0.022), location=(0, 0.254, 1.245),
                                     mat=mats['EyeBlack'], bevel_w=0.002)
    torso_parts.append(keyhole_bot)

    return torso_parts

# ---------------------------------------------------------------------------
# Lower Torso (Pelvis) Builder
# ---------------------------------------------------------------------------

def build_lower_torso(mats):
    """Builds pelvis / waist mechanical unit and leg connector ball joints."""
    pelvis_parts = []
    
    # Main Pelvis block
    pelvis = create_beveled_box("LowerTorso_Pelvis", size=(0.44, 0.30, 0.24), location=(0, 0.01, 0.98),
                                mat=mats['ArmorBlue'], bevel_w=0.03, bevel_s=3)
    pelvis_parts.append(pelvis)
    
    # Belt / Waist Band accent
    belt = create_cylinder("LowerTorso_Belt", radius=0.22, depth=0.05, location=(0, 0.01, 1.08), mat=mats['ArmorDarkBlue'])
    add_bevel(belt, width=0.008)
    pelvis_parts.append(belt)
    
    # Left & Right Hip Socket Spheres (White)
    for side, x_sign in [("Left", -1), ("Right", 1)]:
        hip_socket = create_sphere(f"Hip_Socket_{side}", radius=0.085, location=(x_sign * 0.18, 0.01, 0.90), mat=mats['SharkWhite'])
        pelvis_parts.append(hip_socket)
        
    return pelvis_parts

# ---------------------------------------------------------------------------
# Arms & Hands Builder
# ---------------------------------------------------------------------------

def build_arms_and_hands(mats):
    """Builds shoulders, bicep, elbow, forearm, Stop-hand and Magnifying-glass hand."""
    arm_parts = {
        'LeftUpperArm': [], 'LeftLowerArm': [], 'LeftHand': [],
        'RightUpperArm': [], 'RightLowerArm': [], 'RightHand': []
    }
    
    # --- RIGHT ARM (Posed in HALT / STOP gesture facing forward) ---
    # Right Shoulder Pauldron
    r_shoulder = create_sphere("RightUpperArm_Pauldron", radius=0.125, location=(0.40, 0.04, 1.38),
                               scale=(1.1, 0.95, 1.05), mat=mats['ArmorBlue'])
    arm_parts['RightUpperArm'].append(r_shoulder)
    
    # Right Bicep (angled forward)
    r_bicep = create_cylinder("RightUpperArm_Bicep", radius=0.08, depth=0.18, location=(0.43, 0.12, 1.25),
                              rotation=(-0.5, 0.2, -0.2), mat=mats['ArmorBlue'])
    add_bevel(r_bicep, width=0.015)
    arm_parts['RightUpperArm'].append(r_bicep)
    
    # Right Elbow Joint (White)
    r_elbow = create_beveled_box("RightLowerArm_Elbow", size=(0.11, 0.11, 0.11), location=(0.46, 0.20, 1.15),
                                 mat=mats['SharkWhite'], bevel_w=0.015)
    arm_parts['RightLowerArm'].append(r_elbow)
    
    # Right Forearm (Raised upright in stop pose)
    r_forearm = create_cylinder("RightLowerArm_Forearm", radius=0.082, depth=0.22, location=(0.48, 0.26, 1.28),
                                rotation=(0.4, 0.1, -0.15), mat=mats['ArmorBlue'])
    add_bevel(r_forearm, width=0.015)
    arm_parts['RightLowerArm'].append(r_forearm)
    
    # Right Wrist Cuff (White)
    r_wrist = create_cylinder("RightHand_WristCuff", radius=0.09, depth=0.045, location=(0.49, 0.31, 1.40),
                              rotation=(0.4, 0.1, -0.15), mat=mats['SharkWhite'])
    add_bevel(r_wrist, width=0.008)
    arm_parts['RightHand'].append(r_wrist)
    
    # Right Hand Palm (Facing forward +Y, STOP gesture)
    r_palm = create_beveled_box("RightHand_Palm", size=(0.16, 0.05, 0.14), location=(0.50, 0.35, 1.49),
                                mat=mats['SharkWhite'], bevel_w=0.018, bevel_s=3)
    arm_parts['RightHand'].append(r_palm)
    
    # Right 4 Fingers (Thick cartoon glove)
    # Thumb (Pointing inward/up)
    r_thumb = create_cylinder("RightHand_Thumb", radius=0.024, depth=0.09, location=(0.41, 0.36, 1.48),
                              rotation=(0, 0.5, 0.7), mat=mats['SharkWhite'])
    add_bevel(r_thumb, width=0.01)
    arm_parts['RightHand'].append(r_thumb)
    
    # 3 Main Fingers (Index, Middle, Pinky upright)
    finger_xs = [0.46, 0.51, 0.56]
    finger_lengths = [0.12, 0.135, 0.11]
    for idx, (fx, flen) in enumerate(zip(finger_xs, finger_lengths)):
        finger = create_cylinder(f"RightHand_Finger_{idx}", radius=0.023, depth=flen,
                                 location=(fx, 0.35, 1.57 + flen*0.35),
                                 rotation=(0.05, 0, (idx-1)*0.08), mat=mats['SharkWhite'])
        add_bevel(finger, width=0.01)
        arm_parts['RightHand'].append(finger)

    # --- LEFT ARM (Holding the Magnifying Glass) ---
    # Left Shoulder Pauldron
    l_shoulder = create_sphere("LeftUpperArm_Pauldron", radius=0.125, location=(-0.40, 0.04, 1.38),
                               scale=(1.1, 0.95, 1.05), mat=mats['ArmorBlue'])
    arm_parts['LeftUpperArm'].append(l_shoulder)
    
    # Left Bicep
    l_bicep = create_cylinder("LeftUpperArm_Bicep", radius=0.08, depth=0.18, location=(-0.43, 0.10, 1.25),
                              rotation=(0.4, 0.2, 0.2), mat=mats['ArmorBlue'])
    add_bevel(l_bicep, width=0.015)
    arm_parts['LeftUpperArm'].append(l_bicep)
    
    # Left Elbow Joint (White)
    l_elbow = create_beveled_box("LeftLowerArm_Elbow", size=(0.11, 0.11, 0.11), location=(-0.46, 0.18, 1.15),
                                mat=mats['SharkWhite'], bevel_w=0.015)
    arm_parts['LeftLowerArm'].append(l_elbow)
    
    # Left Forearm (Angled forward towards magnifying glass)
    l_forearm = create_cylinder("LeftLowerArm_Forearm", radius=0.082, depth=0.22, location=(-0.48, 0.26, 1.22),
                                rotation=(0.8, -0.2, 0.2), mat=mats['ArmorBlue'])
    add_bevel(l_forearm, width=0.015)
    arm_parts['LeftLowerArm'].append(l_forearm)
    
    # Left Wrist Cuff (White)
    l_wrist = create_cylinder("LeftHand_WristCuff", radius=0.09, depth=0.045, location=(-0.50, 0.35, 1.27),
                              rotation=(0.8, -0.2, 0.2), mat=mats['SharkWhite'])
    add_bevel(l_wrist, width=0.008)
    arm_parts['LeftHand'].append(l_wrist)
    
    # Left Hand (Curled around magnifying glass handle)
    l_palm = create_beveled_box("LeftHand_Palm", size=(0.13, 0.11, 0.11), location=(-0.52, 0.40, 1.30),
                                mat=mats['SharkWhite'], bevel_w=0.02, bevel_s=3)
    arm_parts['LeftHand'].append(l_palm)
    
    # Curled fingers holding handle
    for idx in range(3):
        cf = create_cylinder(f"LeftHand_CurledFinger_{idx}", radius=0.021, depth=0.09,
                             location=(-0.54, 0.37 + idx*0.035, 1.33),
                             rotation=(0.3, 1.2, 0), mat=mats['SharkWhite'])
        add_bevel(cf, width=0.008)
        arm_parts['LeftHand'].append(cf)

    return arm_parts

# ---------------------------------------------------------------------------
# Magnifying Glass & Phishing Hook Builder (Accessory)
# ---------------------------------------------------------------------------

def build_magnifying_glass(mats):
    """Builds the golden magnifying glass, phishing hook, and caught email envelope."""
    acc_parts = []
    
    # Handle center near (-0.52, 0.40, 1.30), pointing up-forward
    handle_rot = (0.25, 0.15, -0.1)
    
    # 1. Dark ergonomic handle
    handle = create_cylinder("Tool_Handle", radius=0.024, depth=0.28, location=(-0.52, 0.42, 1.28),
                             rotation=handle_rot, mat=mats['DarkHandle'])
    add_bevel(handle, width=0.005)
    acc_parts.append(handle)
    
    # Handle Gold pommel & Gold collar
    pommel = create_cylinder("Tool_Pommel", radius=0.029, depth=0.035, location=(-0.53, 0.38, 1.15),
                             rotation=handle_rot, mat=mats['Gold'])
    acc_parts.append(pommel)
    
    collar = create_cylinder("Tool_Collar", radius=0.028, depth=0.04, location=(-0.51, 0.45, 1.41),
                             rotation=handle_rot, mat=mats['Gold'])
    acc_parts.append(collar)
    
    # 2. Golden Circular Lens Frame
    lens_center = (-0.50, 0.48, 1.62)
    bm_ring = bmesh.new()
    bmesh.ops.create_circle(bm_ring, cap_ends=False, radius=0.18, segments=36)
    # Extrude outward to make flat rim
    # Create outer and inner torus
    me_rim = bpy.data.meshes.new("MagnifyingRimMesh")
    bm_ring.free()
    
    # Simple torus for golden frame
    bpy.ops.mesh.primitive_torus_add(major_radius=0.17, minor_radius=0.018, major_segments=36, minor_segments=12,
                                     location=lens_center, rotation=(1.45, 0.1, -0.2))
    gold_frame = bpy.context.active_object
    gold_frame.name = "Tool_GoldFrame"
    assign_mat(gold_frame, mats['Gold'])
    smooth_mesh(gold_frame)
    acc_parts.append(gold_frame)
    
    # 3. Transparent Glass Lens
    glass_lens = create_cylinder("Tool_GlassLens", radius=0.165, depth=0.008, location=lens_center,
                                 rotation=(1.45, 0.1, -0.2), mat=mats['Glass'], vertices=36)
    acc_parts.append(glass_lens)
    
    # 4. Phishing Hook (Red metallic curved J-hook inside lens)
    bm_hook = bmesh.new()
    # Curved path of fishing hook
    hook_pts = [
        Vector((0, 0, 0.08)),    # Eyelet
        Vector((0, 0, 0.03)),    # Shank
        Vector((0, 0, -0.03)),   # Shank lower
        Vector((-0.02, 0, -0.06)), # Bend start
        Vector((-0.05, 0, -0.05)), # Bend bottom
        Vector((-0.06, 0, -0.02)), # Barb curve
        Vector((-0.05, 0, 0.01)),  # Barb tip
    ]
    prev_r = None
    for pt in hook_pts:
        ring = []
        for a in range(8):
            ang = a * (2 * math.pi / 8)
            ring.append(bm_hook.verts.new(pt + Vector((0.007 * math.cos(ang), 0.007 * math.sin(ang), 0))))
        if prev_r:
            for a in range(8):
                bm_hook.faces.new([prev_r[a], prev_r[(a+1)%8], ring[(a+1)%8], ring[a]])
        prev_r = ring
        
    me_hook = bpy.data.meshes.new("HookMesh")
    bm_hook.to_mesh(me_hook)
    bm_hook.free()
    
    fish_hook = bpy.data.objects.new("Tool_FishingHook", me_hook)
    fish_hook.location = (-0.49, 0.49, 1.63)
    fish_hook.rotation_euler = (0.2, 0.2, 0.3)
    bpy.context.collection.objects.link(fish_hook)
    assign_mat(fish_hook, mats['HookRed'])
    smooth_mesh(fish_hook)
    acc_parts.append(fish_hook)
    
    # 5. Phishing Email Envelope (Caught on hook)
    env = create_beveled_box("Tool_Envelope", size=(0.14, 0.012, 0.10), location=(-0.50, 0.48, 1.58),
                            mat=mats['Envelope'], bevel_w=0.004)
    env.rotation_euler = (0.2, -0.25, 0.15)
    acc_parts.append(env)
    
    # Flap fold triangle detail on envelope
    flap_top = create_cylinder("Tool_EnvelopeFlap", radius=0.003, depth=0.12, location=(-0.50, 0.485, 1.595),
                               rotation=(0.2, -0.25, 1.1), mat=mats['EnvelopeLine'])
    acc_parts.append(flap_top)

    return acc_parts

# ---------------------------------------------------------------------------
# Legs & Chunky Sneakers Builder
# ---------------------------------------------------------------------------

def build_legs_and_shoes(mats):
    """Builds thighs, knee hinges, shin armor, and oversized cartoon sneakers."""
    leg_parts = {
        'LeftUpperLeg': [], 'LeftLowerLeg': [], 'LeftFoot': [],
        'RightUpperLeg': [], 'RightLowerLeg': [], 'RightFoot': []
    }
    
    for side, x_sign in [("Left", -1), ("Right", 1)]:
        u_key = f"{side}UpperLeg"
        l_key = f"{side}LowerLeg"
        f_key = f"{side}Foot"
        
        # 1. Upper Leg / Thigh (Blue angular armor)
        thigh_pos = (x_sign * 0.22, 0.02, 0.74)
        thigh = create_beveled_box(f"{u_key}_Armor", size=(0.18, 0.20, 0.26), location=thigh_pos,
                                   mat=mats['ArmorBlue'], bevel_w=0.025, bevel_s=2)
        leg_parts[u_key].append(thigh)
        
        # Upper hip connector (White)
        hip_conn = create_cylinder(f"{u_key}_Connector", radius=0.065, depth=0.10,
                                   location=(x_sign * 0.20, 0.02, 0.86), mat=mats['SharkWhite'])
        leg_parts[u_key].append(hip_conn)
        
        # 2. Lower Leg / Knee & Shin
        # Knee Joint (White block)
        knee = create_beveled_box(f"{l_key}_Knee", size=(0.14, 0.14, 0.12), location=(x_sign * 0.22, 0.03, 0.58),
                                  mat=mats['SharkWhite'], bevel_w=0.018)
        leg_parts[l_key].append(knee)
        
        # Shin Guard (White plate with bevel)
        shin = create_beveled_box(f"{l_key}_ShinPlate", size=(0.17, 0.18, 0.24), location=(x_sign * 0.22, 0.03, 0.42),
                                  mat=mats['SharkWhite'], bevel_w=0.025, bevel_s=2)
        leg_parts[l_key].append(shin)
        
        # Ankle Collar (Blue high-top band)
        ankle = create_cylinder(f"{l_key}_AnkleCollar", radius=0.115, depth=0.08, location=(x_sign * 0.23, 0.04, 0.28),
                                mat=mats['ArmorBlue'])
        add_bevel(ankle, width=0.012)
        leg_parts[l_key].append(ankle)
        
        # 3. Chunky Cartoon Sneaker / Boot (Foot)
        # Sole (Thick platform white rubber)
        sole_pos = (x_sign * 0.24, 0.09, 0.06)
        sole = create_beveled_box(f"{f_key}_Sole", size=(0.24, 0.38, 0.09), location=sole_pos,
                                  mat=mats['SharkWhite'], bevel_w=0.02, bevel_s=3)
        leg_parts[f_key].append(sole)
        
        # Sneaker Body (Blue)
        body_pos = (x_sign * 0.24, 0.08, 0.16)
        shoe_body = create_beveled_box(f"{f_key}_ShoeBody", size=(0.22, 0.34, 0.14), location=body_pos,
                                       mat=mats['ArmorBlue'], bevel_w=0.025, bevel_s=3)
        leg_parts[f_key].append(shoe_body)
        
        # White Toe Cap (Curved front bumper)
        toe_pos = (x_sign * 0.24, 0.21, 0.13)
        toe_cap = create_sphere(f"{f_key}_ToeCap", radius=0.10, location=toe_pos, scale=(1.05, 0.8, 0.65), mat=mats['SharkWhite'])
        leg_parts[f_key].append(toe_cap)
        
        # White Laces (3 wide horizontal straps across sneaker tongue)
        for lace_idx in range(3):
            ly = 0.04 + lace_idx * 0.06
            lz = 0.20 + lace_idx * 0.02
            lace = create_beveled_box(f"{f_key}_Lace_{lace_idx}", size=(0.14, 0.035, 0.02), location=(x_sign * 0.24, ly, lz),
                                      mat=mats['SharkWhite'], bevel_w=0.005)
            leg_parts[f_key].append(lace)

    return leg_parts

# ---------------------------------------------------------------------------
# Armature & Rigging (Roblox R15 standard)
# ---------------------------------------------------------------------------

def create_roblox_r15_armature():
    """Creates the standard Roblox R15 Armature with bones."""
    arm_data = bpy.data.armatures.new("Scamerino_R15_Armature")
    arm_obj = bpy.data.objects.new("Scamerino_Rig", arm_data)
    bpy.context.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj
    
    bpy.ops.object.mode_set(mode='EDIT')
    edit_bones = arm_data.edit_bones
    
    # Bone definitions: (name, head, tail, parent_name)
    bone_defs = [
        # Root & Pelvis
        ("HumanoidRootPart", Vector((0, 0, 0.95)), Vector((0, 0, 1.20)), None),
        ("LowerTorso",       Vector((0, 0, 0.95)), Vector((0, 0, 1.15)), "HumanoidRootPart"),
        ("UpperTorso",       Vector((0, 0, 1.15)), Vector((0, 0, 1.55)), "LowerTorso"),
        ("Head",             Vector((0, 0, 1.55)), Vector((0, 0, 2.10)), "UpperTorso"),
        
        # Right Arm
        ("RightUpperArm", Vector((0.38, 0.05, 1.38)), Vector((0.45, 0.15, 1.20)), "UpperTorso"),
        ("RightLowerArm", Vector((0.45, 0.15, 1.20)), Vector((0.49, 0.28, 1.36)), "RightUpperArm"),
        ("RightHand",     Vector((0.49, 0.28, 1.36)), Vector((0.52, 0.36, 1.58)), "RightLowerArm"),
        
        # Left Arm
        ("LeftUpperArm",  Vector((-0.38, 0.05, 1.38)), Vector((-0.45, 0.15, 1.20)), "UpperTorso"),
        ("LeftLowerArm",  Vector((-0.45, 0.15, 1.20)), Vector((-0.49, 0.28, 1.25)), "LeftUpperArm"),
        ("LeftHand",      Vector((-0.49, 0.28, 1.25)), Vector((-0.52, 0.40, 1.32)), "LeftLowerArm"),
        
        # Right Leg
        ("RightUpperLeg", Vector((0.22, 0.01, 0.90)), Vector((0.22, 0.02, 0.58)), "LowerTorso"),
        ("RightLowerLeg", Vector((0.22, 0.02, 0.58)), Vector((0.23, 0.04, 0.28)), "RightUpperLeg"),
        ("RightFoot",     Vector((0.23, 0.04, 0.28)), Vector((0.24, 0.18, 0.08)), "RightLowerLeg"),
        
        # Left Leg
        ("LeftUpperLeg",  Vector((-0.22, 0.01, 0.90)), Vector((-0.22, 0.02, 0.58)), "LowerTorso"),
        ("LeftLowerLeg",  Vector((-0.22, 0.02, 0.58)), Vector((-0.23, 0.04, 0.28)), "LeftUpperLeg"),
        ("LeftFoot",      Vector((-0.23, 0.04, 0.28)), Vector((-0.24, 0.18, 0.08)), "LeftLowerLeg"),
    ]
    
    bones = {}
    for name, head, tail, parent in bone_defs:
        b = edit_bones.new(name)
        b.head = head
        b.tail = tail
        bones[name] = b
        
    for name, head, tail, parent in bone_defs:
        if parent:
            bones[name].parent = bones[parent]
            
    bpy.ops.object.mode_set(mode='OBJECT')
    return arm_obj

def rig_part_to_bone(obj, arm_obj, bone_name):
    """Assigns all vertices of obj to a vertex group matching bone_name and adds Armature modifier."""
    # Create vertex group
    vg = obj.vertex_groups.new(name=bone_name)
    verts = [v.index for v in obj.data.vertices]
    vg.add(verts, 1.0, 'REPLACE')
    
    # Add Armature modifier
    mod = obj.modifiers.new(name="Armature", type='ARMATURE')
    mod.object = arm_obj

# ---------------------------------------------------------------------------
# Studio Lighting & Camera for Turnaround Preview Render
# ---------------------------------------------------------------------------

def setup_studio():
    # World lighting
    world = bpy.data.worlds.new("StudioWorld")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = next(n for n in world.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs['Color'].default_value = (0.82, 0.88, 0.96, 1.0)
    bg.inputs['Strength'].default_value = 0.8
    
    # Studio Floor / Backdrop
    bpy.ops.mesh.primitive_plane_add(size=12.0, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.name = "Studio_Floor"
    fmat = bpy.data.materials.new("Mat_StudioFloor")
    fmat.use_nodes = True
    fbsdf = next(n for n in fmat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    fbsdf.inputs['Base Color'].default_value = (0.78, 0.84, 0.92, 1.0)
    fbsdf.inputs['Roughness'].default_value = 0.55
    floor.data.materials.append(fmat)
    
    # Key Light (Front-Right, high)
    key_data = bpy.data.lights.new(name="KeyLight", type='AREA')
    key_data.energy = 550
    key_data.size = 2.5
    key_data.color = (1.0, 0.98, 0.96)
    key_obj = bpy.data.objects.new("KeyLight", key_data)
    key_obj.location = (2.2, 3.4, 3.2)
    dir_k = Vector((0, 0, 1.2)) - key_obj.location
    key_obj.rotation_euler = dir_k.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.collection.objects.link(key_obj)
    
    # Fill Light (Front-Left, softer)
    fill_data = bpy.data.lights.new(name="FillLight", type='AREA')
    fill_data.energy = 260
    fill_data.size = 3.0
    fill_data.color = (0.85, 0.92, 1.0)
    fill_obj = bpy.data.objects.new("FillLight", fill_data)
    fill_obj.location = (-2.6, 3.0, 2.2)
    dir_f = Vector((0, 0, 1.2)) - fill_obj.location
    fill_obj.rotation_euler = dir_f.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.collection.objects.link(fill_obj)
    
    # Rim / Hair Light (Behind character, high rim highlight on fin & silhouette)
    rim_data = bpy.data.lights.new(name="RimLight", type='SPOT')
    rim_data.energy = 850
    rim_data.spot_size = 1.3
    rim_data.color = (1.0, 0.88, 0.65)
    rim_obj = bpy.data.objects.new("RimLight", rim_data)
    rim_obj.location = (0.3, -3.0, 3.4)
    dir_r = Vector((0, 0, 1.5)) - rim_obj.location
    rim_obj.rotation_euler = dir_r.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.collection.objects.link(rim_obj)
    
    # Camera (Front 3/4 hero view, capturing full character from shoes to dorsal fin)
    cam_data = bpy.data.cameras.new(name="HeroCamera")
    cam_data.lens = 44
    cam_obj = bpy.data.objects.new("Camera", cam_data)
    cam_obj.location = (1.3, 3.6, 1.32)
    dir_c = Vector((0, 0.1, 1.15)) - cam_obj.location
    cam_obj.rotation_euler = dir_c.to_track_quat('-Z', 'Y').to_euler()
    bpy.context.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    
    try:
        bpy.context.scene.render.engine = 'BLENDER_EEVEE'
    except TypeError:
        pass
    bpy.context.scene.render.resolution_x = 1080
    bpy.context.scene.render.resolution_y = 1080
    bpy.context.scene.render.resolution_percentage = 100

def consolidate_r15_meshparts(r15_groups, arm_obj):
    """Bakes modifiers and joins sub-meshes into 15 canonical Roblox R15 parts."""
    final_parts = {}
    for part_name, obj_list in r15_groups.items():
        if not obj_list:
            continue
            
        # Apply modifiers on each object before join
        for obj in obj_list:
            bpy.context.view_layer.objects.active = obj
            for mod in list(obj.modifiers):
                try:
                    bpy.ops.object.modifier_apply(modifier=mod.name)
                except Exception:
                    pass
                    
        # Select all in group and join
        bpy.ops.object.select_all(action='DESELECT')
        for obj in obj_list:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = obj_list[0]
        
        if len(obj_list) > 1:
            bpy.ops.object.join()
            
        merged_obj = bpy.context.active_object
        merged_obj.name = part_name
        
        # Determine target bone
        bone_name = part_name if part_name != "MagnifyingGlass" else "LeftHand"
        
        # Setup vertex group for bone weighting
        vg = merged_obj.vertex_groups.new(name=bone_name)
        all_verts = [v.index for v in merged_obj.data.vertices]
        vg.add(all_verts, 1.0, 'REPLACE')
        
        # Add Armature modifier
        mod = merged_obj.modifiers.new(name="Armature", type='ARMATURE')
        mod.object = arm_obj
        
        merged_obj.parent = arm_obj
        final_parts[part_name] = merged_obj
        
    return final_parts

# ---------------------------------------------------------------------------
# Main Execution Pipeline
# ---------------------------------------------------------------------------

def main():
    print("--- Starting Scamerino Alertinio Model Build ---")
    clean_scene()
    
    # 1. Setup materials
    mats = setup_materials()
    print("Materials initialized.")
    
    # 2. Build Armature
    arm_obj = create_roblox_r15_armature()
    print("R15 Armature constructed.")
    
    # 3. Build geometry components
    head_parts = build_shark_head(mats)
    upper_torso_parts = build_upper_torso(mats)
    lower_torso_parts = build_lower_torso(mats)
    arm_parts = build_arms_and_hands(mats)
    magnifying_parts = build_magnifying_glass(mats)
    leg_parts = build_legs_and_shoes(mats)
    
    # 4. HumanoidRootPart
    root_part = create_beveled_box("HumanoidRootPart", size=(0.60, 0.35, 0.60), location=(0, 0.02, 1.10),
                                   mat=mats['ArmorDarkBlue'], bevel_w=0.0)
    root_part.display_type = 'WIRE'
    
    # 5. Group into canonical Roblox R15 parts
    r15_groups = {
        "Head": head_parts,
        "UpperTorso": upper_torso_parts,
        "LowerTorso": lower_torso_parts,
        "RightUpperArm": arm_parts['RightUpperArm'],
        "RightLowerArm": arm_parts['RightLowerArm'],
        "RightHand": arm_parts['RightHand'],
        "LeftUpperArm": arm_parts['LeftUpperArm'],
        "LeftLowerArm": arm_parts['LeftLowerArm'],
        "LeftHand": arm_parts['LeftHand'],
        "RightUpperLeg": leg_parts['RightUpperLeg'],
        "RightLowerLeg": leg_parts['RightLowerLeg'],
        "RightFoot": leg_parts['RightFoot'],
        "LeftUpperLeg": leg_parts['LeftUpperLeg'],
        "LeftLowerLeg": leg_parts['LeftLowerLeg'],
        "LeftFoot": leg_parts['LeftFoot'],
        "MagnifyingGlass": magnifying_parts,
        "HumanoidRootPart": [root_part],
    }
    
    final_r15_parts = consolidate_r15_meshparts(r15_groups, arm_obj)
    print(f"Consolidated into {len(final_r15_parts)} canonical Roblox R15 parts.")
    
    # 6. Lighting & Camera
    setup_studio()
    print("Lighting & Camera setup.")
    
    # 7. Paths
    output_dir = "/Users/robert/Documents/Projects/hackyeah2026/MakeNoMistakesTeam/assets"
    os.makedirs(output_dir, exist_ok=True)
    
    blend_path = os.path.join(output_dir, "scamerino_alertino.blend")
    fbx_path = os.path.join(output_dir, "scamerino_alertino.fbx")
    glb_path = os.path.join(output_dir, "scamerino_alertino.glb")
    preview_path = os.path.join(output_dir, "scamerino_alertino_preview.png")
    
    # 8. Render Preview Image
    bpy.context.scene.render.filepath = preview_path
    print(f"Rendering preview to {preview_path}...")
    bpy.ops.render.render(write_still=True)
    print("Render finished.")
    
    # 9. Save .blend file
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"Saved Blender file: {blend_path}")
    
    # 10. Export FBX (Optimized for Roblox Studio Avatar Importer)
    try:
        bpy.ops.export_scene.fbx(
            filepath=fbx_path,
            use_selection=False,
            global_scale=1.0,
            apply_unit_scale=True,
            apply_scale_options='FBX_SCALE_ALL',
            axis_forward='-Z',
            axis_up='Y',
            bake_space_transform=True,
            object_types={'ARMATURE', 'MESH'},
            use_armature_deform_only=True,
            add_leaf_bones=False,
            primary_bone_axis='Y',
            secondary_bone_axis='X',
            armature_nodetype='NULL'
        )
        print(f"Exported FBX: {fbx_path}")
    except Exception as e:
        print(f"FBX Export note: {e}")
        bpy.ops.export_scene.fbx(filepath=fbx_path)
        print(f"Exported FBX (standard): {fbx_path}")
        
    # 11. Export glTF / GLB (Modern Roblox & web 3D format)
    try:
        bpy.ops.export_scene.gltf(
            filepath=glb_path,
            export_format='GLB',
            export_apply=True,
            export_yup=True
        )
        print(f"Exported GLB: {glb_path}")
    except Exception as e:
        print(f"GLTF Export note: {e}")
        
    print("=== Scamerino Alertinio Model Build COMPLETE! ===")

if __name__ == '__main__':
    main()
