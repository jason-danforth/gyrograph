"""Provides a scripting component.
    Inputs:
        x: The x script variable
        y: The y script variable
    Output:
        a: The a output variable"""

__author__ = "jason"
__version__ = "2020.02.05"

import Rhino
import System
import math
import Rhino.Geometry as rg
from Grasshopper.Kernel.Data import GH_Path
from Grasshopper import DataTree

"""
A BRIEF INTRODUCTION
This project allows users to build drawing machines from a kit of parts,
and then run their machine to produce 3D line drawings. The "parts" fall into
three main catagories: 

1. "Tubes" are long, connections and can accept additional
parts along their lengths, or plugged into their ends (Tubes 2 and 3 can be plugged
into either end of Tube 1, and Nibs can be plugged into any of the Tubes, whereas 
Motors can be slotted into various positions along the outsides of the Tubes).  

2. "Motors" drive the rotation of the drawing machine by spinning the Tubes they
are connected to. Motors have numerous connections, and every motor has at least
one "engine" that will spin a Tube (the thickened connection) and usually one or
more connections that will not spin a Tube (the thin slots), but just attach to it.
Motors will always spin their Tiubes according to the right-hand rule, but can be 
placed in multiple orientations in order to rotate Tubes clockwise and counter-clockwise.
Note that motors will spin Tubes 2/3 at twice the speed as Tube 1, to create as much
potential variation in the drawing machines as possible.

3. "Nibs" draw the lines!!! Place a Nib anywhere you'd like to create a new line, and
when the user clicks "DRAW" the machine will run and the Nibs will trace out the drawing.
"""

#Inputs
global rotation_angle
global rotation_sin
global rotation_cos
global part_list
global selection_list

global nib_item
global traces_points
global traces_lines

traces_points = []
traces_lines = []
manual_points = DataTree[object]()

rotation_angle = rotation_angle * 0.0175 #Convert angle from degrees to radians
"""
Tubes 2/3 rotate twice as fast as Tube 1, and all tubes are slightly adjusted 
to require 10-20 rotations before arriving back at the start point
This is how we create the spirorgraph effect, rather than drawing a single
curve that repeats exactly every 360 degrees
"""
#Rotation for Tube 1
rotation_sin_1 = math.sin(rotation_angle * 0.95)
rotation_cos_1 = math.cos(rotation_angle * 0.95)
#Rotation for Tubes 2 and 3
rotation_sin_2 = math.sin(rotation_angle * 1.9)
rotation_cos_2 = math.cos(rotation_angle * 1.9)

#----------Geometry Inputs----------------------------------------------------------------------------------------------------------

"""
Each part (base, tube, motor, nib, etc.) and all of its source geometry is read in as a global variable.
Inner and Outer placements for Tubes share the same geometry and can be created in the part's function
Target geometry is always a duplicate of singular pairs of tags/axes/guides and can be created in the part's function
Naming convention for tags is: PartName_Connection_Type_Selection, so "tube3_a_axis_1" is the first axis on the
A end of Tube 3. Similarly, "motor1_tube2b_guide_2" is the second guide option for the second Tube 2 connection
for Motor 1.
"""

#Base is simple because it's already in place
global base_sphere
global base_tube
global base_axis
global base_guide

"""
Tube 1 is the simplest of the Tubes with only 2 possible placements:
2 axes (ends A and B) x 1 guide each. 
"""
global tube1_geo
global tube1_a_axis_1
global tube1_a_guide_1
global tube1_b_axis_1
global tube1_b_guide_1

"""
Tube 2 is the only tube with a mid-point, so 3 possible placements:
3 axes (end A, middle, and end B) x 1 guide each. Note that A and B are
used to represent the ends on the other tubes, so we use "mid" for Tube 2
instead of changing to A, B, and C. 
"""
global tube2_geo
global tube2_a_axis_1
global tube2_a_guide_1
global tube2_mid_axis_1
global tube2_mid_guide_1
global tube2_b_axis_1
global tube2_b_guide_1

"""
Tube 3 is the only tube where orientation matters (b/c of its asymmetrical bend)
and has 8 possible placements: 2 axes (1 for each end of the tube) x 4 guides
each, for 0, 90, 180, or 270 degrees
"""
global tube3_geo
global tube3_a_axis_1
global tube3_a_guide_1
global tube3_a_guide_2
global tube3_a_guide_3
global tube3_a_guide_4
global tube3_b_axis_1
global tube3_b_guide_1
global tube3_b_guide_2
global tube3_b_guide_3
global tube3_b_guide_4

"""
Motor 1 has 6 possible placements. Connection A has the motor that drives rotation, so
it can be placed along a right-handed or left-handed axis, but doesn't care about 0, 9, 180, 270 
degrees, so each axis only has 1 guide (note that there is a different guide for each axis so that when the
motor is flipped, connection B stays in the same orientation). Connection B doesn't rotate, but its orientation 
still determines the handedness of A as a target for future geometry, so it has 2 axes x 2 orientations for 
0 and 180 degrees.
"""
global motor1_geo
global motor1_tube2a_axis_1
global motor1_tube2a_axis_2
global motor1_tube2a_guide_1
global motor1_tube2a_guide_2
global motor1_tube2b_axis_1
global motor1_tube2b_axis_2
global motor1_tube2b_guide_1
global motor1_tube2b_guide_2

"""
Motor 2 has 4 possible placements. Connection A and B both have motors that drive rotation, so
they can be placed along a right-handed or left-handed axis, but don't care about 0, 9, 180, 270 
degrees, so each axis only has 1 guide (note that there is a different guide for each axis so that when the
motor is flipped, the other connection stays in the same orientation). 
"""
global motor2_geo
global motor2_tube2a_axis_1
global motor2_tube2a_axis_2
global motor2_tube2a_guide_1
global motor2_tube2a_guide_2
global motor2_tube2b_axis_1
global motor2_tube2b_axis_2
global motor2_tube2b_guide_1
global motor2_tube2b_guide_2

"""
Motor 3 has 10 possible placements. Connection tube2a has the motor that drives rotation, so
it can be placed along a right-handed or left-handed axis, but doesn't care about 0, 9, 180, 270 
degrees, so each axis only has 1 guide (note that there is a different guide for each axis so that when the
motor is flipped, the other connections stay in the same orientation). Connection tube2b ("b" because it is
the second possible location for a tube 2 or 3) doesn't rotate, but its orientation still determines the 
handedness of tube2a as a target for future geometry, so it has 2 axes x 2 orientations for 0 and 180 degrees. 
Connection tube1 is just like tube2b, except that it accepts Tube 1 instead of Tube 2 or 3.
"""
global motor3_geo
global motor3_tube2a_axis_1
global motor3_tube2a_axis_2
global motor3_tube2a_guide_1
global motor3_tube2a_guide_2
global motor3_tube2b_axis_1
global motor3_tube2b_axis_2
global motor3_tube2b_guide_1
global motor3_tube2b_guide_2
global motor3_tube1_axis_1
global motor3_tube1_axis_2
global motor3_tube1_guide_1
global motor3_tube1_guide_2

"""
Motor 4 has 10 possible placements. Connection tube1a has the motor that drives rotation, so
it can be placed along a right-handed or left-handed axis, but doesn't care about 0, 9, 180, 270 
degrees, so each axis only has 1 guide (note that there is a different guide for each axis so that when the
motor is flipped, the other connections stay in the same orientation). Connection tube1b ("b" because it is
the second possible location for a tube 1) doesn't rotate, but its orientation still determines the 
handedness of tube1a as a target for future geometry, so it has 2 axes x 2 orientations for 0 and 180 degrees. 
Connection tube2 is just like tube1b, except that it accepts Tubes 2/3 instead of Tube 1.
"""
global motor4_geo
global motor4_tube1a_axis_1
global motor4_tube1a_axis_2
global motor4_tube1a_guide_1
global motor4_tube1a_guide_2
global motor4_tube1b_axis_1
global motor4_tube1b_axis_2
global motor4_tube1b_guide_1
global motor4_tube1b_guide_2
global motor4_tube2_axis_1
global motor4_tube2_axis_2
global motor4_tube2_guide_1
global motor4_tube2_guide_2

"""
Motor 5 has 10 possible placements. Connection tube1a has the motor that drives rotation, so
it can be placed along a right-handed or left-handed axis, but doesn't care about 0, 9, 180, 270 
degrees, so each axis only has 1 guide (note that there is a different guide for each axis so that when the
motor is flipped, the other connections stay in the same orientation). Connection tube1b ("b" because it is
the second possible location for a tube 1) doesn't rotate, but its orientation still determines the 
handedness of tube1a as a target for future geometry, so it has 2 axes x 2 orientations for 0 and 180 degrees. 
Connection tube2 is just like tube1b, except that it accepts Tubes 2/3 instead of Tube 1.
"""
global motor5_geo
global motor5_tube1a_axis_1
global motor5_tube1a_axis_2
global motor5_tube1a_guide_1
global motor5_tube1a_guide_2
global motor5_tube1b_axis_1
global motor5_tube1b_axis_2
global motor5_tube1b_guide_1
global motor5_tube1b_guide_2
global motor5_tube2_axis_1
global motor5_tube2_axis_2
global motor5_tube2_guide_1
global motor5_tube2_guide_2

"""
Nibs trace out the lines that the drawing machine "draws". On one hand, they are fairly simple: there's the 
mesh (or geo), a point whose location is recorded to create the drawn lines, and a plug that tapers down from
the width of the inside of Tube 1 (where Tubes 2/3 are also plugged in) to the width of the inside of Tubes 2/3
(the whole reason that Tubes 2/3 have an inner plug is to accept Nibs). This allows Nibs to be placed anywhere 
that Tubes 2/3 can be placed, as well as into either end of Tubes 2/3 themselves.
The thing that makes Nibs complicated is that the Motors are not all the same size, resulting in more axes and guides 
than should be necessary.
"""
global nib_geo
global nib_pt
global nib_tube1_axis_1
global nib_tube1_axis_2
global nib_tube1_guide1
global nib_tube2_axis_1
global nib_tube2_axis_2
global nib_tube2_guide_1
global nib_motors1_axis_1 #For direction 1 in non-rotating placements in motors
global nib_motors1_axis_2 #For direction 2 in non-rotating placements in motors
global nib_motors2_axis_1 #For direction 1 in rotating placements in motors
global nib_motors2_axis_2 #For direction 1 in rotating placements in motors
global nib_motors1_guide_1 
global nib_motors2_guide_1 


"""
Next, each geometry variable is paired with its Rhino object. This is done by iterating over each 
object in the Rhino document, checking its unique GUID, and pairing it with the appropriate variable.
"""
guid_base_sphere = System.Guid.Parse('97b05396-34d4-44d9-93c2-9e4f7d1dd25e')
guid_base_tube = System.Guid.Parse('2d56c098-e5a6-4d4b-a96f-a4206e8d6754')
guid_base_axis = System.Guid.Parse('cc4d087d-b190-492d-a1dd-30fcea4b304c')
guid_base_guide = System.Guid.Parse('d12c3e0e-d53b-4787-a606-59ebcb415449')

guid_tube1_geo = System.Guid.Parse('baecf306-abc6-499a-bb12-9918473ebe3a')
guid_tube1_a_axis_1 = System.Guid.Parse('869fdf2e-0b29-4b8b-9e35-0184a4e5db98')
guid_tube1_a_guide_1 = System.Guid.Parse('604360b7-330c-4772-aeee-4226ce7d23d3')
guid_tube1_b_axis_1 = System.Guid.Parse('5ea1588f-62dc-4958-9f16-5291f83e6151')
guid_tube1_b_guide_1 = System.Guid.Parse('11e8391e-4575-440d-b0c4-6a91f15e221e')

guid_tube2_geo = System.Guid.Parse('9e719d5c-a279-4123-ad2a-ae3f5be2f50c')
guid_tube2_a_axis_1 = System.Guid.Parse('e71299db-93e8-4bd3-92c8-4493057f2f14')
guid_tube2_a_guide_1 = System.Guid.Parse('31a42eaf-ff49-4f48-8942-a7854b20c445')
guid_tube2_mid_axis_1 = System.Guid.Parse('600196e2-14a8-49ce-8dfb-af6d3dfec5ef')
guid_tube2_mid_guide_1 = System.Guid.Parse('457c4692-c26b-4d5e-b79b-a271c40b98fd')
guid_tube2_b_axis_1 = System.Guid.Parse('b9312cca-d859-488f-ada8-dfb360db3b30')
guid_tube2_b_guide_1 = System.Guid.Parse('7343890b-1be2-4e28-9d57-2f498ab59fbd')

guid_tube3_geo = System.Guid.Parse('39541263-d316-4544-8117-3123e0f6f29c')
guid_tube3_a_axis_1 = System.Guid.Parse('0a87114f-0349-4bdf-b8ba-ce9a9a89ad58')
guid_tube3_a_guide_1 = System.Guid.Parse('df779ead-c6b0-4fbe-88cb-06f7c29724e0')
guid_tube3_a_guide_2 = System.Guid.Parse('5cbaa5f3-5d8c-4a21-84ea-f080d115c76c')
guid_tube3_a_guide_3 = System.Guid.Parse('1b539d36-a7ad-45e4-a7e9-f69aab90511e')
guid_tube3_a_guide_4 = System.Guid.Parse('e4f43cb0-6bea-4234-a11f-df7adf241703')
guid_tube3_b_axis_1 = System.Guid.Parse('2d0cb88d-9820-459b-b0a9-1553e87e1a8c')
guid_tube3_b_guide_1 = System.Guid.Parse('415f134e-f3d1-45ee-8e63-cd1e930003bd')
guid_tube3_b_guide_2 = System.Guid.Parse('2064f76d-9536-43c8-a016-c1772c7cee40')
guid_tube3_b_guide_3 = System.Guid.Parse('52246726-e947-4f0b-aa3f-49ca771dfbb1')
guid_tube3_b_guide_4 = System.Guid.Parse('a55e04db-3c76-4e94-bb9a-77e03285808b')

guid_motor1_geo = System.Guid.Parse('cbaedd7f-4ca7-474e-a9c0-2ec264437606')
guid_motor1_tube2a_axis_1 = System.Guid.Parse('d87049ac-8ab9-4b84-922e-0f909f178253')
guid_motor1_tube2a_axis_2 = System.Guid.Parse('26b68b5b-17b2-4e69-b55b-fb9fb6f90456')
guid_motor1_tube2a_guide_1 = System.Guid.Parse('5cc68bff-2f21-4876-94e1-e7042efd7225')
guid_motor1_tube2a_guide_2 = System.Guid.Parse('a5b06d1b-191c-41b7-a8c8-ad5990abe3c9')
guid_motor1_tube2b_axis_1 = System.Guid.Parse('815db08a-f4f8-4ace-87b7-d0f7a51b26cd')
guid_motor1_tube2b_axis_2 = System.Guid.Parse('de923821-cf5d-42e6-b0d0-96184901bb91')
guid_motor1_tube2b_guide_1 = System.Guid.Parse('70815750-23f6-4b7b-b146-7d87da127349')
guid_motor1_tube2b_guide_2 = System.Guid.Parse('7afaa2c0-5b3c-49e7-a242-13b74d25e46e')

guid_motor2_geo = System.Guid.Parse('6b3b4fb6-b0c5-476a-a0cb-925194c0b693')
guid_motor2_tube2a_axis_1 = System.Guid.Parse('7ec16399-062b-43b5-8aba-b5c5b63a1904')
guid_motor2_tube2a_axis_2 = System.Guid.Parse('ca6ba297-e809-4dda-928b-9a21566fff81')
guid_motor2_tube2a_guide_1 = System.Guid.Parse('baf8614f-ae9b-4296-9653-c9acfc9463e2')
guid_motor2_tube2a_guide_2 = System.Guid.Parse('e3d5e76b-9258-4bba-8782-ba423df56031')
guid_motor2_tube2b_axis_1 = System.Guid.Parse('f268259a-5b26-4ff4-9fb5-18ad33ecd96a')
guid_motor2_tube2b_axis_2 = System.Guid.Parse('d6f2659b-8348-4b7f-9dd3-d4e734dcada3')
guid_motor2_tube2b_guide_1 = System.Guid.Parse('d669698d-8bff-46d1-9998-5b98471e9694')
guid_motor2_tube2b_guide_2 = System.Guid.Parse('8b1206a0-acc2-474a-b486-1c418c68c98b')

guid_motor3_geo = System.Guid.Parse('35b7e82e-babd-462f-93a6-471dcb2410dd')
guid_motor3_tube2a_axis_1 = System.Guid.Parse('9827a61b-150e-4662-8949-0aeddbc5a0d7')
guid_motor3_tube2a_axis_2 = System.Guid.Parse('773a9227-77de-4732-a685-255afc656a47')
guid_motor3_tube2a_guide_1 = System.Guid.Parse('dcba8bb5-0a0a-4a72-ba12-fe9fef6d7a3b')
guid_motor3_tube2a_guide_2 = System.Guid.Parse('4cd557e3-b282-4c33-a0d5-d600344177e4')
guid_motor3_tube2b_axis_1 = System.Guid.Parse('f7c4568f-10cc-4147-9936-f9ed3ea441a0')
guid_motor3_tube2b_axis_2 = System.Guid.Parse('bd053046-bd15-4a95-a6cb-477bdc44e064')
guid_motor3_tube2b_guide_1 = System.Guid.Parse('0c18822a-acb0-44bf-a996-25425fe8ccf4')
guid_motor3_tube2b_guide_2 = System.Guid.Parse('9b34971d-2a89-45bf-b288-b2d3bd020a10')
guid_motor3_tube1_axis_1 = System.Guid.Parse('ce3966b2-1c01-4fd8-b733-9ba5f4a13ab9')
guid_motor3_tube1_axis_2 = System.Guid.Parse('72b9e06d-00e1-46d0-807d-7bfb4509138d')
guid_motor3_tube1_guide_1 = System.Guid.Parse('1440ce39-0a21-46b6-a5d1-7ede789b0056')
guid_motor3_tube1_guide_2 = System.Guid.Parse('26fbf4ed-33b8-43b2-b606-1f6ad42edd7a')

guid_motor4_geo = System.Guid.Parse('01e91a80-950c-4c33-b0ac-d137b270fb79')
guid_motor4_tube1a_axis_1 = System.Guid.Parse('644e5856-31d5-485a-8685-abd3c3717e0d')
guid_motor4_tube1a_axis_2 = System.Guid.Parse('73ef2088-1d43-43c7-b3c4-fc16617907c7')
guid_motor4_tube1a_guide_1 = System.Guid.Parse('ea0f086e-14f9-47a1-b950-484d95b652fe')
guid_motor4_tube1a_guide_2 = System.Guid.Parse('2920a97b-0755-4078-98de-347f552cf7cb')
guid_motor4_tube1b_axis_1 = System.Guid.Parse('7a1c9242-6322-4dff-9c4c-648cad5da272')
guid_motor4_tube1b_axis_2 = System.Guid.Parse('e278324e-6cf4-412e-8944-e55fd7e34942')
guid_motor4_tube1b_guide_1 = System.Guid.Parse('949a31a0-3836-4875-aeb8-1c3d514f0395')
guid_motor4_tube1b_guide_2 = System.Guid.Parse('e05ee1db-c8f5-4ac8-97c1-43706316ff7f')
guid_motor4_tube2_axis_1 = System.Guid.Parse('a378c7e2-6128-4031-80dc-6c09572fb4ca')
guid_motor4_tube2_axis_2 = System.Guid.Parse('51259bad-98a0-4e43-88c3-9a6961b40a51')
guid_motor4_tube2_guide_1 = System.Guid.Parse('921723d6-5607-43c8-9261-321964b0e0c8')
guid_motor4_tube2_guide_2 = System.Guid.Parse('970f9036-7518-4943-b8c8-0350e36bcd57')

guid_motor5_geo = System.Guid.Parse('7959e07c-073b-4ae3-9085-fd4eb1a64d4f')
guid_motor5_tube1a_axis_1 = System.Guid.Parse('747a447d-ea08-45fe-b688-8b69e94cd1a8')
guid_motor5_tube1a_axis_2 = System.Guid.Parse('17eeea6e-6882-42e5-aacb-a05c556c96b8')
guid_motor5_tube1a_guide_1 = System.Guid.Parse('a950d3a3-91b7-476d-a5ca-8934c7aaf091')
guid_motor5_tube1a_guide_2 = System.Guid.Parse('37fbff06-6e55-440f-b0df-d8b2f8dd690e')
guid_motor5_tube1b_axis_1 = System.Guid.Parse('72121828-30fb-4e60-b14d-ab799ecc437f')
guid_motor5_tube1b_axis_2 = System.Guid.Parse('6cec41f9-af81-45af-9e85-b883f284aeac')
guid_motor5_tube1b_guide_1 = System.Guid.Parse('6435980a-e8d6-4213-b6ef-7d9d834e0e5e')
guid_motor5_tube1b_guide_2 = System.Guid.Parse('5d72c9f8-deb0-492b-94b2-6a9594fac9ba')
guid_motor5_tube2_axis_1 = System.Guid.Parse('5f406a7f-3a05-40b8-91ec-44cf04132cc5')
guid_motor5_tube2_axis_2 = System.Guid.Parse('3e7e29e3-0dc7-406f-b0ae-b7ba078762df')
guid_motor5_tube2_guide_1 = System.Guid.Parse('bfa66d13-8af2-44af-b147-9cedf04d7efb')
guid_motor5_tube2_guide_2 = System.Guid.Parse('cd949e11-fa56-44df-bd9c-c75d50cdd37d')

guid_nib_geo = System.Guid.Parse('991612b7-9699-4abe-bc9b-99ddf5098854')
guid_nib_pt = System.Guid.Parse('92657b99-21a1-4efa-ad06-c56247726c7e')
guid_nib_tube2_axis_1 = System.Guid.Parse('d88f9519-939c-4293-8139-ad176efd6e48')
guid_nib_tube2_axis_2 = System.Guid.Parse('5f3e532e-059c-42d4-b808-75ca54fb287b')
guid_nib_tube2_guide_1 = System.Guid.Parse('51b71f31-9b26-4961-9cc7-9354fd13a3da')
guid_nib_tube1_axis_1 = System.Guid.Parse('7b8394b1-902a-4207-b634-a19ffa79e45d')
guid_nib_tube1_axis_2 = System.Guid.Parse('a57ebc3c-cdb4-4074-9c43-66bd01dd4291')
guid_nib_tube1_guide_1 = System.Guid.Parse('f2a213a6-5fee-4097-b547-4cf9cb6e0c69')
guid_nib_motors1_axis_1 = System.Guid.Parse('d56c673f-2021-4078-bab9-f6d9f4ed8b9e')
guid_nib_motors1_axis_2 = System.Guid.Parse('03ce8a0f-9f7a-46f0-b542-85e0161e02db')
guid_nib_motors2_axis_1 = System.Guid.Parse('2a84a5ca-6598-480d-8f8e-fa7c40ba7788')
guid_nib_motors2_axis_2 = System.Guid.Parse('0a45a967-efb4-4e46-8910-ed3660966681')
guid_nib_motors1_guide_1 = System.Guid.Parse('043d467f-b31c-4372-8fa4-fd90ece65c2d')
guid_nib_motors2_guide_1 = System.Guid.Parse('b3a0cc74-0854-464f-8e68-af8dd777bcb0')


#Scrub through all objects in the Rhino Doc
for obj in Rhino.RhinoDoc.ActiveDoc.Objects:
    if obj.Id == guid_base_sphere: base_sphere = obj.Geometry
    elif obj.Id == guid_base_tube: base_tube = obj.Geometry
    elif obj.Id == guid_base_axis: base_axis = obj.Geometry
    elif obj.Id == guid_base_guide: base_guide = obj.Geometry
    
    elif obj.Id == guid_tube1_geo: tube1_geo = obj.Geometry
    elif obj.Id == guid_tube1_a_axis_1: tube1_a_axis_1 = obj.Geometry
    elif obj.Id == guid_tube1_a_guide_1: tube1_a_guide_1 = obj.Geometry
    elif obj.Id == guid_tube1_b_axis_1: tube1_b_axis_1 = obj.Geometry
    elif obj.Id == guid_tube1_b_guide_1: tube1_b_guide_1 = obj.Geometry
    
    elif obj.Id == guid_tube2_geo: tube2_geo = obj.Geometry
    elif obj.Id == guid_tube2_a_axis_1: tube2_a_axis_1 = obj.Geometry
    elif obj.Id == guid_tube2_a_guide_1: tube2_a_guide_1 = obj.Geometry
    elif obj.Id == guid_tube2_mid_axis_1: tube2_mid_axis_1 = obj.Geometry
    elif obj.Id == guid_tube2_mid_guide_1: tube2_mid_guide_1 = obj.Geometry
    elif obj.Id == guid_tube2_b_axis_1: tube2_b_axis_1 = obj.Geometry
    elif obj.Id == guid_tube2_b_guide_1: tube2_b_guide_1 = obj.Geometry
    
    elif obj.Id == guid_tube3_geo: tube3_geo = obj.Geometry
    elif obj.Id == guid_tube3_a_axis_1: tube3_a_axis_1 = obj.Geometry
    elif obj.Id == guid_tube3_a_guide_1: tube3_a_guide_1 = obj.Geometry
    elif obj.Id == guid_tube3_a_guide_2: tube3_a_guide_2 = obj.Geometry
    elif obj.Id == guid_tube3_a_guide_3: tube3_a_guide_3 = obj.Geometry
    elif obj.Id == guid_tube3_a_guide_4: tube3_a_guide_4 = obj.Geometry
    elif obj.Id == guid_tube3_b_axis_1: tube3_b_axis_1 = obj.Geometry
    elif obj.Id == guid_tube3_b_guide_1: tube3_b_guide_1 = obj.Geometry
    elif obj.Id == guid_tube3_b_guide_2: tube3_b_guide_2 = obj.Geometry
    elif obj.Id == guid_tube3_b_guide_3: tube3_b_guide_3 = obj.Geometry
    elif obj.Id == guid_tube3_b_guide_4: tube3_b_guide_4 = obj.Geometry
    
    elif obj.Id == guid_motor1_geo: motor1_geo = obj.Geometry
    elif obj.Id == guid_motor1_tube2a_axis_1: motor1_tube2a_axis_1 = obj.Geometry
    elif obj.Id == guid_motor1_tube2a_axis_2: motor1_tube2a_axis_2 = obj.Geometry
    elif obj.Id == guid_motor1_tube2a_guide_1: motor1_tube2a_guide_1 = obj.Geometry
    elif obj.Id == guid_motor1_tube2a_guide_2: motor1_tube2a_guide_2 = obj.Geometry
    elif obj.Id == guid_motor1_tube2b_axis_1: motor1_tube2b_axis_1 = obj.Geometry
    elif obj.Id == guid_motor1_tube2b_axis_2: motor1_tube2b_axis_2 = obj.Geometry
    elif obj.Id == guid_motor1_tube2b_guide_1: motor1_tube2b_guide_1 = obj.Geometry
    elif obj.Id == guid_motor1_tube2b_guide_2: motor1_tube2b_guide_2 = obj.Geometry
    
    elif obj.Id == guid_motor2_geo: motor2_geo = obj.Geometry
    elif obj.Id == guid_motor2_tube2a_axis_1: motor2_tube2a_axis_1 = obj.Geometry
    elif obj.Id == guid_motor2_tube2a_axis_2: motor2_tube2a_axis_2 = obj.Geometry
    elif obj.Id == guid_motor2_tube2a_guide_1: motor2_tube2a_guide_1 = obj.Geometry
    elif obj.Id == guid_motor2_tube2a_guide_2: motor2_tube2a_guide_2 = obj.Geometry
    elif obj.Id == guid_motor2_tube2b_axis_1: motor2_tube2b_axis_1 = obj.Geometry
    elif obj.Id == guid_motor2_tube2b_axis_2: motor2_tube2b_axis_2 = obj.Geometry
    elif obj.Id == guid_motor2_tube2b_guide_1: motor2_tube2b_guide_1 = obj.Geometry
    elif obj.Id == guid_motor2_tube2b_guide_2: motor2_tube2b_guide_2 = obj.Geometry
    
    elif obj.Id == guid_motor3_geo: motor3_geo = obj.Geometry
    elif obj.Id == guid_motor3_tube2a_axis_1: motor3_tube2a_axis_1 = obj.Geometry
    elif obj.Id == guid_motor3_tube2a_axis_2: motor3_tube2a_axis_2 = obj.Geometry
    elif obj.Id == guid_motor3_tube2a_guide_1: motor3_tube2a_guide_1 = obj.Geometry
    elif obj.Id == guid_motor3_tube2a_guide_2: motor3_tube2a_guide_2 = obj.Geometry
    elif obj.Id == guid_motor3_tube2b_axis_1: motor3_tube2b_axis_1 = obj.Geometry
    elif obj.Id == guid_motor3_tube2b_axis_2: motor3_tube2b_axis_2 = obj.Geometry
    elif obj.Id == guid_motor3_tube2b_guide_1: motor3_tube2b_guide_1 = obj.Geometry
    elif obj.Id == guid_motor3_tube2b_guide_2: motor3_tube2b_guide_2 = obj.Geometry
    elif obj.Id == guid_motor3_tube1_axis_1: motor3_tube1_axis_1 = obj.Geometry
    elif obj.Id == guid_motor3_tube1_axis_2: motor3_tube1_axis_2 = obj.Geometry
    elif obj.Id == guid_motor3_tube1_guide_1: motor3_tube1_guide_1 = obj.Geometry
    elif obj.Id == guid_motor3_tube1_guide_2: motor3_tube1_guide_2 = obj.Geometry
    
    elif obj.Id == guid_motor4_geo: motor4_geo = obj.Geometry
    elif obj.Id == guid_motor4_tube1a_axis_1: motor4_tube1a_axis_1 = obj.Geometry
    elif obj.Id == guid_motor4_tube1a_axis_2: motor4_tube1a_axis_2 = obj.Geometry
    elif obj.Id == guid_motor4_tube1a_guide_1: motor4_tube1a_guide_1 = obj.Geometry
    elif obj.Id == guid_motor4_tube1a_guide_2: motor4_tube1a_guide_2 = obj.Geometry
    elif obj.Id == guid_motor4_tube1b_axis_1: motor4_tube1b_axis_1 = obj.Geometry
    elif obj.Id == guid_motor4_tube1b_axis_2: motor4_tube1b_axis_2 = obj.Geometry
    elif obj.Id == guid_motor4_tube1b_guide_1: motor4_tube1b_guide_1 = obj.Geometry
    elif obj.Id == guid_motor4_tube1b_guide_2: motor4_tube1b_guide_2 = obj.Geometry
    elif obj.Id == guid_motor4_tube2_axis_1: motor4_tube2_axis_1 = obj.Geometry
    elif obj.Id == guid_motor4_tube2_axis_2: motor4_tube2_axis_2 = obj.Geometry
    elif obj.Id == guid_motor4_tube2_guide_1: motor4_tube2_guide_1 = obj.Geometry
    elif obj.Id == guid_motor4_tube2_guide_2: motor4_tube2_guide_2 = obj.Geometry
    
    elif obj.Id == guid_motor5_geo: motor5_geo = obj.Geometry
    elif obj.Id == guid_motor5_tube1a_axis_1: motor5_tube1a_axis_1 = obj.Geometry
    elif obj.Id == guid_motor5_tube1a_axis_2: motor5_tube1a_axis_2 = obj.Geometry
    elif obj.Id == guid_motor5_tube1a_guide_1: motor5_tube1a_guide_1 = obj.Geometry
    elif obj.Id == guid_motor5_tube1a_guide_2: motor5_tube1a_guide_2 = obj.Geometry
    elif obj.Id == guid_motor5_tube1b_axis_1: motor5_tube1b_axis_1 = obj.Geometry
    elif obj.Id == guid_motor5_tube1b_axis_2: motor5_tube1b_axis_2 = obj.Geometry
    elif obj.Id == guid_motor5_tube1b_guide_1: motor5_tube1b_guide_1 = obj.Geometry
    elif obj.Id == guid_motor5_tube1b_guide_2: motor5_tube1b_guide_2 = obj.Geometry
    elif obj.Id == guid_motor5_tube2_axis_1: motor5_tube2_axis_1 = obj.Geometry
    elif obj.Id == guid_motor5_tube2_axis_2: motor5_tube2_axis_2 = obj.Geometry
    elif obj.Id == guid_motor5_tube2_guide_1: motor5_tube2_guide_1 = obj.Geometry
    elif obj.Id == guid_motor5_tube2_guide_2: motor5_tube2_guide_2 = obj.Geometry
    
    elif obj.Id == guid_nib_geo: nib_geo = obj.Geometry
    elif obj.Id == guid_nib_pt: nib_pt = obj.Geometry
    elif obj.Id == guid_nib_tube2_axis_1: nib_tube2_axis_1 = obj.Geometry
    elif obj.Id == guid_nib_tube2_axis_2: nib_tube2_axis_2 = obj.Geometry
    elif obj.Id == guid_nib_tube2_guide_1: nib_tube2_guide_1 = obj.Geometry
    elif obj.Id == guid_nib_tube1_axis_1: nib_tube1_axis_1 = obj.Geometry
    elif obj.Id == guid_nib_tube1_axis_2: nib_tube1_axis_2 = obj.Geometry
    elif obj.Id == guid_nib_tube1_guide_1: nib_tube1_guide_1 = obj.Geometry
    elif obj.Id == guid_nib_motors1_axis_1: nib_motors1_axis_1 = obj.Geometry
    elif obj.Id == guid_nib_motors1_axis_2: nib_motors1_axis_2 = obj.Geometry
    elif obj.Id == guid_nib_motors2_axis_1: nib_motors2_axis_1 = obj.Geometry
    elif obj.Id == guid_nib_motors2_axis_2: nib_motors2_axis_2 = obj.Geometry
    elif obj.Id == guid_nib_motors1_guide_1: nib_motors1_guide_1 = obj.Geometry
    elif obj.Id == guid_nib_motors2_guide_1: nib_motors2_guide_1 = obj.Geometry
    
    else: pass



#----------Tags----------------------------------------------------------------------------------------------------------
"""
Tags are, without a doubt, the wonkiest part of this entire project...
Each tag is a reference to a potential placement, or "target". For example, if a Tube 1 has
already been made part of the drawing machine, it can accept new parts in several placements:
there are two identical ends, labeled a and b, and each end can accept geometry along the outside
of the tube (e.g. a Motor 5) or on the inside of the tube (e.g. a Tube 2, Tube 3, or Nib).
The value of each tag is a long string of potential placements that it accepts, so the outside
of a Tube 1 can accept Motor 3 (one placement option), Motor 4 (two placement options), or 
Motor 5 (two placement options). 

As mentioned above, all of the below tags represent "targets" that can accept additional geometry.
Within the functions that define each part, there are also "source" tags, which define each possible 
placement for a given part. Source tags are singular. An example would be "motor4_tube1_a", whice defines
one of two options for placing a Motor 4 part onto a Tube 1. The generate_selection_pairs() function
takes each source tag from a desired part and generates a list of available pairings (such as "motor4_tube1_a"
and tag_tube1_a_outer) so that the user can select a placement. The steps of this process are defined in more 
detail within the functions for each individual part (such as tube1(), motor4(), etc.).
"""

global tag_base_outer
global tag_base_inner

global tag_tube1_a_outer
global tag_tube1_a_inner
global tag_tube1_b_outer
global tag_tube1_b_inner

global tag_tube2_a_outer
global tag_tube2_a_inner
global tag_tube2_mid_outer
global tag_tube2_b_outer
global tag_tube2_b_inner

global tag_tube3_a_outer
global tag_tube3_a_inner
global tag_tube3_b_outer
global tag_tube3_b_inner

global tag_motor1_tube2_a
global tag_motor1_tube2_b

global tag_motor2_tube2_a
global tag_motor2_tube2_b

global tag_motor3_tube1
global tag_motor3_tube2_a
global tag_motor3_tube2_b

global tag_motor4_tube1_a
global tag_motor4_tube1_b
global tag_motor4_tube2

global tag_motor5_tube1_a
global tag_motor5_tube1_b
global tag_motor5_tube2

global tag_nib_tube2_a
global tag_nib_tube2_b
global tag_nib_tube1_a
global tag_nib_tube1_b
global tag_nib_motors_1
global tag_nib_motors_2

"""
Note that the Base geometry does not receive unique tags.
Tubes 2/3 will drop the source axes/guides for their inner placement (i.e. available for Nibs) 
when they are placed inside Tube 1, but that logic will need to be updated in order to to also 
drop the inner axes/guides if placed in the Base. Otherwise a Nib will be allowed
to be placed in the end of a Tube 2/3 that is already inside the Base. 

The alternative, current implementation, is to use the Tube 1 tags for the Base, with the only 
drawback being that a Nib can be placed in the Base, which can't draw a line b/c it just rotates 
around a single point.
"""

tag_tube1_a_outer = "motor3_tube1, motor4_tube1_a, motor4_tube1_b, motor5_tube1_a, motor5_tube1_b" 
tag_tube1_a_inner = "tube2_b_outer, tube3_b_outer, nib_tube1_a"
tag_tube1_b_outer = "motor3_tube1, motor4_tube1_a, motor4_tube1_b, motor5_tube1_a, motor5_tube1_b"
tag_tube1_b_inner = "tube2_a_outer, tube3_a_outer, nib_tube1_b"

tag_tube2_a_outer = "tube1_b_inner, motor1_tube2_a, motor1_tube2_b, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a, motor3_tube2_b, motor4_tube2, motor5_tube2"
tag_tube2_a_inner = "nib_tube2_a"
tag_tube2_mid_outer = "motor1_tube2_a, motor1_tube2_b, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a, motor3_tube2_b, motor4_tube2, motor5_tube2"
tag_tube2_b_outer = "tube1_a_inner, motor1_tube2_a, motor1_tube2_b, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a, motor3_tube2_b, motor4_tube2, motor5_tube2"
tag_tube2_b_inner = "nib_tube2_b"

tag_tube3_a_outer = "tube1_b_inner, motor1_tube2_a, motor1_tube2_b, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a, motor3_tube2_b, motor4_tube2, motor5_tube2"
tag_tube3_a_inner = "nib_tube2_a"
tag_tube3_b_outer = "tube1_a_inner, motor1_tube2_a, motor1_tube2_b, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a, motor3_tube2_b, motor4_tube2, motor5_tube2"
tag_tube3_b_inner = "nib_tube2_b"

tag_motor1_tube2_a = "tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_2"
tag_motor1_tube2_b = "tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_1"

tag_motor2_tube2_a = "tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_2"
tag_motor2_tube2_b = "tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_2"

tag_motor3_tube1 = "tube1_a_outer, tube1_b_outer"
tag_motor3_tube2_a = "tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_2"
tag_motor3_tube2_b = "tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_1"

tag_motor4_tube1_a = "tube1_a_outer, tube1_b_outer"
tag_motor4_tube1_b = "tube1_a_outer, tube1_b_outer"
tag_motor4_tube2 = "tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_1"

tag_motor5_tube1_a = "tube1_a_outer, tube1_b_outer"
tag_motor5_tube1_b = "tube1_a_outer, tube1_b_outer"
tag_motor5_tube2 = "tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_1"

"""
As mentioned above, the thing that makes Nibs complicated is that the Motors are designed to be assymetrical so that it would be obviuos
which way they are going to rotate, but that means the Nibs need a WHOLE LOT of axes/guides to account for all the different lengths of 
the motors, which means the tags are also really complicated... 
The way the other parts work is this: tubes have an A end and a B end, each with one axis. Motors have two axes for each connection, so 
that they can be placed on either end of the tube in a right or left-handed orientation. The Nibs, however, can be placed in either end
of the motor, and each placement has a unique guide to 
"""
tag_nib_tube1_a = "tube1_a_inner"
tag_nib_tube1_b = "tube1_b_inner"
tag_nib_tube2_a = "tube2_a_inner, tube3_a_inner"
tag_nib_tube2_b = "tube2_b_inner, tube3_b_inner"
tag_nib_motors_1 = "motor1_tube2_b, motor3_tube2_b, motor4_tube2, motor5_tube2" #Non-rotating motor placements
tag_nib_motors_2 = "motor1_tube2_a, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a" #Rotating motor placements

#----------Block Definitions----------------------------------------------------------------------------------------------------------


def generate_selection_pairs(source_tags, target_tags):
    #Generate list of tuples containing indices for all permutations of available source/target pairs
    pair_list = []
    
    for i, target_tag in enumerate(target_tags):
        for j, source_tag in enumerate(source_tags):
            if source_tag in target_tag.split(", "):
                pair_list.append((j, i))
    
    return pair_list


def next_part(parts, target_axes, target_guides, target_tags, count, nib_item):
    if (part_list.length > count) {
        block = part_list[count]
        
        if part_list[count] == "Tube 1":
            try:
                tube1(parts, target_axes, target_guides, target_tags, count, nib_item)
            except:
                count += 1
                next_part(parts, target_axes, target_guides, target_tags, count, nib_item)
        
        elif part_list[count] == "Tube 2":
            try:
                tube2(parts, target_axes, target_guides, target_tags, count, nib_item)
            except:
                count += 1
                next_part(parts, target_axes, target_guides, target_tags, count, nib_item)
        
        elif part_list[count] == "Tube 3":
            try:
                tube3(parts, target_axes, target_guides, target_tags, count, nib_item)
            except:
                count += 1
                next_part(parts, target_axes, target_guides, target_tags, count, nib_item)
        
        elif part_list[count] == "Motor 1":
            try:
                motor1(parts, target_axes, target_guides, target_tags, count, nib_item)
            except:
                count += 1
                next_part(parts, target_axes, target_guides, target_tags, count, nib_item)
        
        elif part_list[count] == "Motor 2":
            try:
                motor2(parts, target_axes, target_guides, target_tags, count, nib_item)
            except:
                count += 1
                next_part(parts, target_axes, target_guides, target_tags, count, nib_item)
        
        elif part_list[count] == "Motor 3":
            try:
                motor3(parts, target_axes, target_guides, target_tags, count, nib_item)
            except:
                count += 1
                next_part(parts, target_axes, target_guides, target_tags, count, nib_item)
        
        elif part_list[count] == "Motor 4":
            try:
                motor4(parts, target_axes, target_guides, target_tags, count, nib_item)
            except:
                count += 1
                next_part(parts, target_axes, target_guides, target_tags, count, nib_item)
        
        elif part_list[count] == "Motor 5":
            try:
                motor5(parts, target_axes, target_guides, target_tags, count, nib_item)
            except:
                count += 1
                next_part(parts, target_axes, target_guides, target_tags, count, nib_item)
        
        elif part_list[count] == "Nib":
            try:
                nib(parts, target_axes, target_guides, target_tags, count, nib_item)
            except:
                count += 1
                next_part(parts, target_axes, target_guides, target_tags, count, nib_item)
        
        else:
            print "Block does not exist."
            count += 1
            next_part(parts, target_axes, target_guides, target_tags, count, nib_item)
        
    else:
        print "Done"
        return parts, target_axes, target_guides

    }


def angle_cross_product(target, source):
    """
    This function takes two 3D vectors and determines the angle between them (a function of their dot product), 
    and the axis for their rotation (the cross product, which represents a third vector orthogonal to the first two).
    Note that the dot product will only return an angle between 0 and 180, so the orientation of the cross product 
    is used in conjunction with the right-hand rule, with rotation occurring in a counter-clockwise direction.
    
    This function expects a target and source curve, originally drawn in Rhino, that will be
    converted into vectors. The curves can be axes or guides.
    """
    
    target_normal = target.PointAt(1) - target.PointAt(0)
    source_normal = source.PointAt(1) - source.PointAt(0)
    
    #Cross Product [cx, cy, cz] is the normal vector or axis of rotation
    cx = (source_normal[1] * target_normal[2]) - (source_normal[2] * target_normal[1])
    cy = (source_normal[2] * target_normal[0]) - (source_normal[0] * target_normal[2])
    cz = (source_normal[0] * target_normal[1]) - (source_normal[1] * target_normal[0])
    cross_product = rg.Vector3d(cx, cy, cz)
    
    #Dot Product is used to find the angle between the two vectors (calculation is simplified for unit vectors)
    #A dot product of 1 means that the vectors are parallel, a dot product of 0 means that the vectors are orthogonal
    dot_product = (target_normal[0] * source_normal[0]) + (target_normal[1] * source_normal[1]) + (target_normal[2] * source_normal[2])
    
    #math.acos() only accepts -1 <= x <= 1, so the following code avoids errors from numbers like 1.000000000000000000002
    if dot_product >= 1: angle = 0
    elif dot_product <= -1: angle = math.pi
    else: angle = math.acos(dot_product)
    
    return [angle, cross_product]


def orient3d(geo, source_axis, source_guide, potential_axes, potential_guides, target_axis, target_guide):
    """
    This function places source geometry (the part itself(geo) and all axes/guides) onto the target geometry,
    and orients the geometry to correctly align in 3d space. The function expects a mesh for the source geometry (geo), 
    a source axis and guide, a target axis and guide (all chosen earlier from available option), as well as lists of
    potential_axes and potential_guides that will eventually be added to the list of target axes/guides in a future step.
    
    In order to accomplish this, the function follows three distint steps:
    
    Step 1: rotate the two axes into alignment in 3d space.
    This step finds the angle and axis of rotation (the cross product) between the source and target axes,
    and then rotates the source geometry into alignment prior to placing the source geometry onto the target.
    
    Step 2: move the source geometry to the target geometry.
    This step is the most straightforward of the three as it is a simple translation.
    
    Step 3: rotate the two guides into alignment in 3d space.
    Because the axis vectors don't track rotation around themselves, source and target parts will typically be oriented
    correctly along their axes, but still in need of additional rotation AROUND those axes to reach final alignment. 
    This is why there are source and target guides, and Step 3 finds the angle between the guidesfor this final rotation.
    """
    
    #Step 1: rotate the two axes into alignment in 3d space
    #angle, cross_product = angle_cross_product(target_axis, flipped_source)
    angle, cross_product = angle_cross_product(target_axis, source_axis)
    
    rotation = rg.Transform.Rotation(math.sin(angle), math.cos(angle), cross_product, source_axis.PointAt(0))
    geo.Transform(rotation)
    source_axis.Transform(rotation)
    source_guide.Transform(rotation)
    for axis in potential_axes: axis.Transform(rotation) 
    for guide in potential_guides: guide.Transform(rotation)
    
    
    #Step 2: move the source geometry to the target geometry
    movement = rg.Transform.Translation(rg.Vector3d(target_axis.PointAt(0) - source_axis.PointAt(0)))
    geo.Transform(movement)
    source_axis.Transform(movement)
    source_guide.Transform(movement)
    for axis in potential_axes: axis.Transform(movement)
    for guide in potential_guides: guide.Transform(movement)
    
    
    #Step 3: rotate the two guides into alignment in 3d space
    angle, cross_product = angle_cross_product(target_guide, source_guide)
    
    """
    When cross_product is close to 0 (as happens when vectors are parallel), there's no axis for rotation. 
    This isn't a problem if the angle is 0 (truly parallel), but is a big problem if the angle is 180
    (vectors are inverted). In that condition, the source_axis can be substituted for the cross_product,
    but that is not a generalizeable solution, because the angle will always be between 0 and 180 and
    the direction of rotation will always be determined by the right hand rule, so we need to allow for 
    the direction of the axis to flip.
    """
    if round(angle, 5) == 3.14159 and abs(round((cross_product[0] + cross_product[1] + cross_product[2]), 6)) == 0:
        cross_product = rg.Vector3d(source_axis.PointAt(1) - source_axis.PointAt(0))
    
    rotation = rg.Transform.Rotation(math.sin(angle), math.cos(angle), cross_product, source_axis.PointAt(0))
    geo.Transform(rotation)
    for axis in potential_axes: axis.Transform(rotation) 
    for guide in potential_guides: guide.Transform(rotation)
    
    
    #No point in returning source_axis and source_guide b/c they aren't needed anymore
    return_objects = [geo, potential_axes, potential_guides]
    return return_objects


def base():
    #Define geometry
    sphere = base_sphere.Duplicate()
    tube = base_tube.Duplicate()
    axis = base_axis.Duplicate()
    guide = base_guide.Duplicate()
    
    #Transform
    axis_vector = rg.Vector3d(axis.PointAt(0) - axis.PointAt(0.5))
    rotation = rg.Transform.Rotation(math.sin(rotation_angle), math.cos(rotation_angle), axis_vector, axis.PointAt(0))
    sphere.Transform(rotation)
    tube.Transform(rotation)
    axis.Transform(rotation)
    guide.Transform(rotation)
    
    #Modify master lists (parts, target_axes, target_guides, target_tags)
    nib_item = 0
    parts = []
    target_axes = []
    target_guides = []
    target_tags = []
    
    print "Adding Base"
    parts.append(sphere)
    parts.append(tube)
    
    target_axes.append(axis)
    target_axes.append(axis)
    target_guides.append(guide)
    target_guides.append(guide)
    target_tags.append(tag_tube1_a_outer)
    target_tags.append(tag_tube1_a_inner)
    
    count = 0
    
    next_part(parts, target_axes, target_guides, target_tags, count, nib_item)
    
    return parts, target_axes, target_guides


def tube1(parts, target_axes, target_guides, target_tags, count, nib_item):
    """
    There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    """
    
    try:
        selection_index = selection_list[count]
    except:
        selection_index = 0
    
    
    #Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    geo = tube1_geo.Duplicate()
    a_axis_1 = tube1_a_axis_1.Duplicate()
    a_guide_1 = tube1_a_guide_1.Duplicate()
    b_axis_1 = tube1_b_axis_1.Duplicate()
    b_guide_1 = tube1_b_guide_1.Duplicate()
    
    
    """
    Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function
    Note: Tube 1 can be positioned according to inner (like plugging onto the end of a smaller Tube 2/3) or outer placements (like slotting into a motor). 
    The Inner and Outer placements share axes/guides but have different tags.
    """
    source_tags = ['tube1_a_outer', 'tube1_a_inner', 'tube1_b_outer', 'tube1_b_inner']
    source_axes = [a_axis_1, a_axis_1, b_axis_1, b_axis_1]
    source_guides = [a_guide_1, a_guide_1, b_guide_1, b_guide_1]
    
    
    """
    Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    Once we know the source aixs and guide, we can ignore the remaining source geo b/c it's irrlevant
    We drop the other source geo and only transform the axes/guides that will form future targets (see next step)
    """
    pair_list = generate_selection_pairs(source_tags, target_tags)
    source_target_pair = pair_list[selection_index % len(pair_list)]
    source_tag_selection = source_tags[source_target_pair[0]] #a special name for a special tag (see final step)
    source_axis = source_axes[source_target_pair[0]]
    source_guide = source_guides[source_target_pair[0]]
    target_tag = target_tags.pop(source_target_pair[1])
    target_axis = target_axes.pop(source_target_pair[1])
    target_guide = target_guides.pop(source_target_pair[1])
    
    #If Tube 1 is placed on Tube 2/3, then we have to remove the corresponding Tube 2/3 inner plane
    #I.E. you can't place a Nib in the end of Tube 2/3 that is already in Tube 1
    if target_tag == tag_tube2_a_outer or target_tag == tag_tube2_b_outer or target_tag == tag_tube3_a_outer or target_tag == tag_tube3_b_outer:
        target_tags.pop(source_target_pair[1]) #Inner plane will always follow the available outer plane 
        target_axes.pop(source_target_pair[1]) #Use source_target_pair[1] b/c the index has already been popped, shortening the list, so no need for +1
        target_guides.pop(source_target_pair[1])
    
    
    """
    Step 4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
    All of that geometry will be transformed according to the selected source/target geometry.
    Note that the .Duplicate() method is necessary to avoid Transforms on the same geometry
    We need potential_source_tags and potential_target_tags for the final step. 
    """
    potential_source_tags = ['tube1_a_outer', 'tube1_a_inner', 'tube1_b_outer', 'tube1_b_inner']
    potential_target_tags = [tag_tube1_a_outer, tag_tube1_a_inner, tag_tube1_b_outer, tag_tube1_b_inner]
    potential_axes = [a_axis_1.Duplicate(), a_axis_1.Duplicate(), b_axis_1.Duplicate(), b_axis_1.Duplicate()]
    potential_guides = [a_guide_1.Duplicate(), a_guide_1.Duplicate(), b_guide_1.Duplicate(), b_guide_1.Duplicate()]
    
    
    #Step 5. Transform (orient and rotate) mesh and all potential_target geo
    returned_objects = orient3d(geo, source_axis, source_guide, potential_axes, potential_guides, target_axis, target_guide)
    geo = returned_objects[0]
    potential_axes = returned_objects[1]
    potential_guides = returned_objects[2]
    
    
    """
    Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop
    """
    print "Adding Tube 1"
    parts.append(geo)
    
    for i, tag in enumerate(potential_source_tags):
        if tag == source_tag_selection:
            pass
        else:
            target_axes.append(potential_axes[i])
            target_guides.append(potential_guides[i])
            target_tags.append(potential_target_tags[i])
    
    
    #Create next block
    count += 1
    next_part(parts, target_axes, target_guides, target_tags, count, nib_item)


def tube2(parts, target_axes, target_guides, target_tags, count, nib_item):
    """
    There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    """
    
    try:
        selection_index = selection_list[count]
    except:
        selection_index = 0
    
    
    #Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    geo = tube2_geo.Duplicate()
    a_axis_1 = tube2_a_axis_1.Duplicate()
    a_guide_1 = tube2_a_guide_1.Duplicate()
    mid_axis_1 = tube2_mid_axis_1.Duplicate()
    mid_guide_1 = tube2_mid_guide_1.Duplicate()
    b_axis_1 = tube2_b_axis_1.Duplicate()
    b_guide_1 = tube2_b_guide_1.Duplicate()
    
    
    """
    Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function
    """
    source_tags = ['tube2_a_outer', 'tube2_mid_outer', 'tube2_b_outer']
    source_axes = [a_axis_1, mid_axis_1, b_axis_1]
    source_guides = [a_guide_1, mid_guide_1, b_guide_1]
    
    
    """
    Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    Once we know the source aixs and guide, we can ignore the remaining source geo b/c it's irrlevant
    We drop the other source geo and only transform the axes/guides that will form future targets (see next step)
    """
    pair_list = generate_selection_pairs(source_tags, target_tags)
    source_target_pair = pair_list[selection_index % len(pair_list)]
    source_tag_selection = source_tags[source_target_pair[0]] #a special name for a special tag (see final step)
    source_axis = source_axes[source_target_pair[0]]
    source_guide = source_guides[source_target_pair[0]]
    target_tag = target_tags.pop(source_target_pair[1])
    target_axis = target_axes.pop(source_target_pair[1])
    target_guide = target_guides.pop(source_target_pair[1])
    
    """
    Step 4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
    All of that geometry will be transformed according to the selected source/target geometry.
    Note that the .Duplicate() method is necessary to avoid Transforms on the same geometry
    We need potential_source_tags and potential_target_tags for the final step. 
    In the case of Tube 2, there are 5 potential targets: a_inner, a_outer, mid_outer, b_inner, b_outer
    but tubes 2/3 are a little more complicated than the other parts, b/c when they are placed
    inside tube1, both the outer placement AND the corresponding inner placement is lost
    i.e. you can't place a nib in the end of tube 2/3 if that tube is already plugged into a tube1
    For that reason, the list of potential_target_axes/guides is related to the chosen target_tag
    """
    if target_tag == tag_tube1_a_inner:
        potential_source_tags = ['tube2_a_outer', 'tube2_a_inner', 'tube2_mid_outer']
        potential_target_tags = [tag_tube2_a_outer, tag_tube2_a_inner, tag_tube2_mid_outer]
        potential_axes = [a_axis_1.Duplicate(), a_axis_1.Duplicate(), mid_axis_1.Duplicate()]
        potential_guides = [a_guide_1.Duplicate(), a_guide_1.Duplicate(), mid_guide_1.Duplicate()]
    elif target_tag == tag_tube1_b_inner:
        potential_source_tags = ['tube2_b_outer', 'tube2_b_inner', 'tube2_mid_outer']
        potential_target_tags = [tag_tube2_b_outer, tag_tube2_b_inner, tag_tube2_mid_outer]
        potential_axes = [b_axis_1.Duplicate(), b_axis_1.Duplicate(), mid_axis_1.Duplicate()]
        potential_guides = [b_guide_1.Duplicate(), b_guide_1.Duplicate(), mid_guide_1.Duplicate()]
    else:
        potential_source_tags = ['tube2_a_outer', 'tube2_a_inner', 'tube2_mid_outer', 'tube2_b_outer', 'tube2_b_inner']
        potential_target_tags = [tag_tube2_a_outer, tag_tube2_a_inner, tag_tube2_mid_outer, tag_tube2_b_outer, tag_tube2_b_inner]
        potential_axes = [a_axis_1.Duplicate(), a_axis_1.Duplicate(), mid_axis_1.Duplicate(), b_axis_1.Duplicate(), b_axis_1.Duplicate()]
        potential_guides = [a_guide_1.Duplicate(), a_guide_1.Duplicate(), mid_guide_1.Duplicate(), b_guide_1.Duplicate(), b_guide_1.Duplicate()]
    
    
    #Step 5. Transform (orient and rotate) mesh and all potential_target geo
    returned_objects = orient3d(geo, source_axis, source_guide, potential_axes, potential_guides, target_axis, target_guide)
    geo = returned_objects[0]
    potential_axes = returned_objects[1]
    potential_guides = returned_objects[2]
    
    
    """
    Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop
    """
    print "Adding Tube 2"
    parts.append(geo)
    
    for i, tag in enumerate(potential_source_tags):
        if tag == source_tag_selection:
            pass
        else:
            target_axes.append(potential_axes[i])
            target_guides.append(potential_guides[i])
            target_tags.append(potential_target_tags[i])
    
    
    #Create next block
    count += 1
    next_part(parts, target_axes, target_guides, target_tags, count, nib_item)


def tube3(parts, target_axes, target_guides, target_tags, count, nib_item):
    """
    There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    """
    
    try:
        selection_index = selection_list[count]
    except:
        selection_index = 0
    
    
    #Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    geo = tube3_geo.Duplicate()
    a_axis_1 = tube3_a_axis_1.Duplicate()
    a_guide_1 = tube3_a_guide_1.Duplicate()
    a_guide_2 = tube3_a_guide_2.Duplicate()
    a_guide_3 = tube3_a_guide_3.Duplicate()
    a_guide_4 = tube3_a_guide_4.Duplicate()
    b_axis_1 = tube3_b_axis_1.Duplicate()
    b_guide_1 = tube3_b_guide_1.Duplicate()
    b_guide_2 = tube3_b_guide_2.Duplicate()
    b_guide_3 = tube3_b_guide_3.Duplicate()
    b_guide_4 = tube3_b_guide_4.Duplicate()
    
    
    """
    Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function
    """
    source_tags = ['tube3_a_outer', 'tube3_a_outer', 'tube3_a_outer', 'tube3_a_outer', 'tube3_b_outer', 'tube3_b_outer', 'tube3_b_outer', 'tube3_b_outer']
    source_axes = [a_axis_1, a_axis_1, a_axis_1, a_axis_1, b_axis_1, b_axis_1, b_axis_1, b_axis_1]
    source_guides = [a_guide_1, a_guide_2, a_guide_3, a_guide_4, b_guide_1, b_guide_2, b_guide_3, b_guide_4]
    
    
    """
    Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    Once we know the source aixs and guide, we can ignore the remaining source geo b/c it's irrlevant
    We drop the other source geo and only transform the axes/guides that will form future targets (see next step)
    """
    pair_list = generate_selection_pairs(source_tags, target_tags)
    source_target_pair = pair_list[selection_index % len(pair_list)]
    source_tag_selection = source_tags[source_target_pair[0]] #a special name for a special tag (see final step)
    source_axis = source_axes[source_target_pair[0]]
    source_guide = source_guides[source_target_pair[0]]
    target_tag = target_tags.pop(source_target_pair[1])
    target_axis = target_axes.pop(source_target_pair[1])
    target_guide = target_guides.pop(source_target_pair[1])
    
    """
    Step 4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
    All of that geometry will be transformed according to the selected source/target geometry.
    Note that the .Duplicate() method is necessary to avoid Transforms on the same geometry
    We need potential_source_tags and potential_target_tags for the final step. 
    In the case of tube3, there are 4 potential targets: a_inner, a_outer, b_inner, b_outer
    but tubes 2/3 are a little more complicated than the other parts, b/c when they are placed
    inside tube1, both the outer placement AND the corresponding inner placement is lost
    i.e. you can't place a nib in the end of tube 2/3 if that tube is already plugged into a tube1
    For that reason, the list of potential_target_axes/guides is related to the chosen target_tag
    """
    if target_tag == tag_tube1_a_inner:
        potential_source_tags = ['tube3_a_outer', 'tube3_a_inner']
        potential_target_tags = [tag_tube3_a_outer, tag_tube3_a_inner]
        potential_axes = [a_axis_1.Duplicate(), a_axis_1.Duplicate()]
        potential_guides = [a_guide_1.Duplicate(), a_guide_1.Duplicate()]
    elif target_tag == tag_tube1_b_inner:
        potential_source_tags = ['tube3_b_outer', 'tube3_b_inner']
        potential_target_tags = [tag_tube3_b_outer, tag_tube3_b_inner]
        potential_axes = [b_axis_1.Duplicate(), b_axis_1.Duplicate()]
        potential_guides = [b_guide_1.Duplicate(), b_guide_1.Duplicate()]
    else:
        potential_source_tags = ['tube3_a_outer', 'tube3_a_inner', 'tube3_b_outer', 'tube3_b_inner']
        potential_target_tags = [tag_tube3_a_outer, tag_tube3_a_inner, tag_tube3_b_outer, tag_tube3_b_inner]
        potential_axes = [a_axis_1.Duplicate(), a_axis_1.Duplicate(), b_axis_1.Duplicate(), b_axis_1.Duplicate()]
        potential_guides = [a_guide_1.Duplicate(), a_guide_1.Duplicate(), b_guide_1.Duplicate(), b_guide_1.Duplicate()]
    
    
    #Step 5. Transform (orient and rotate) mesh and all potential_target geo
    returned_objects = orient3d(geo, source_axis, source_guide, potential_axes, potential_guides, target_axis, target_guide)
    geo = returned_objects[0]
    potential_axes = returned_objects[1]
    potential_guides = returned_objects[2]
    
    
    """
    Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop
    """
    print "Adding Tube 3"
    parts.append(geo)
    
    for i, tag in enumerate(potential_source_tags):
        if tag == source_tag_selection:
            pass
        else:
            target_axes.append(potential_axes[i])
            target_guides.append(potential_guides[i])
            target_tags.append(potential_target_tags[i])
    
    
    #Create next block
    count += 1
    next_part(parts, target_axes, target_guides, target_tags, count, nib_item)


def motor1(parts, target_axes, target_guides, target_tags, count, nib_item):
    """
    There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    """
    
    try:
        selection_index = selection_list[count]
    except:
        selection_index = 0
    
    
    """
    Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    Motor 1 has 6 possible placements: the side with the motor has 1 guide and can be placed left-handed 
    or right-handed the side without the motor can be left or right-handed with either of 2 guides. These 
    placements are all detailed below in Step 2
    """
    geo = motor1_geo.Duplicate()
    a_axis_1 = motor1_tube2a_axis_1.Duplicate()
    a_axis_2 = motor1_tube2a_axis_2.Duplicate()
    a_guide_1 = motor1_tube2a_guide_1.Duplicate()
    a_guide_2 = motor1_tube2a_guide_2.Duplicate()
    b_axis_1 = motor1_tube2b_axis_1.Duplicate()
    b_axis_2 = motor1_tube2b_axis_2.Duplicate()
    b_guide_1 = motor1_tube2b_guide_1.Duplicate()
    b_guide_2 = motor1_tube2b_guide_2.Duplicate()
    
    
    """
    Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function
    """
    source_tags = ['motor1_tube2_a', 'motor1_tube2_a', 'motor1_tube2_b', 'motor1_tube2_b', 'motor1_tube2_b', 'motor1_tube2_b']
    source_axes = [a_axis_1, a_axis_2, b_axis_1, b_axis_2, b_axis_1, b_axis_2]
    source_guides = [a_guide_1, a_guide_2, b_guide_1, b_guide_2, b_guide_2, b_guide_1]

    
    """
    Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    Once we know the source aixs and guide, we can ignore the remaining source geo b/c it's irrlevant
    We drop the other source geo and only transform the axes/guides that will form future targets (see next step)
    """
    pair_list = generate_selection_pairs(source_tags, target_tags)
    source_target_pair = pair_list[selection_index % len(pair_list)]
    source_tag_selection = source_tags[source_target_pair[0]] #a special name for a special tag (see final step)
    source_axis = source_axes[source_target_pair[0]]
    source_guide = source_guides[source_target_pair[0]]
    target_tag = target_tags.pop(source_target_pair[1])
    target_axis = target_axes.pop(source_target_pair[1])
    target_guide = target_guides.pop(source_target_pair[1])
    
    
    """
    Step 4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
    All of that geometry will be transformed according to the selected source/target geometry.
    Note that the .Duplicate() method is necessary to avoid Transforms on the same geometry
    We need potential_source_tags and potential_target_tags for the final step. 
    In the case of Motor1, there are 2 potential targets: a (with motor) and b (without)
    """
    potential_source_tags = ['motor1_tube2_a', 'motor1_tube2_b']
    potential_target_tags = [tag_motor1_tube2_a, tag_motor1_tube2_b]
    potential_axes = [a_axis_1.Duplicate(), b_axis_1.Duplicate()]
    potential_guides = [a_guide_1.Duplicate(), b_guide_1.Duplicate()]
    
    
    """
    Step 5. Transform 
    This is a relatively simple step for Tubes and Nibs, b/c geometry just needs to be oriented and moved to the target geo.
    It's slightly more complicated for Motors, because the additional rotation of the "motor" needs to be accounted for.
    Step 5A: Rotate Motor (and guides if necessary)
    """
    axis_vector = rg.Vector3d(a_axis_1.PointAt(1) - a_axis_1.PointAt(0))
    rotation = rg.Transform.Rotation(rotation_sin_2, rotation_cos_2, axis_vector, a_axis_1.PointAt(0))
    #If the "motor" connection is selected as the source, then the entire part and all axes/guides will rotate with it
    #Note that we do NOT transform the source_guide, we need to preserve a point of reference
    #i.e. the change in position relative to the starting point in the local coordinates of the source geo
    if source_tag_selection == "motor1_tube2_a":
        geo.Transform(rotation)
        potential_axes[1].Transform(rotation) #First axis doesn't rotate b/c everything is rotating around it
        for guide in potential_guides: guide.Transform(rotation)
    #Otherwise, the guide associated with the "motor" connection (and only this guide) wiil rotate in place
    else:
        potential_guides[0].Transform(rotation)
    
    #Step 5B: Add Motor to target geometry
    returned_objects = orient3d(geo, source_axis, source_guide, potential_axes, potential_guides, target_axis, target_guide)
    geo = returned_objects[0]
    potential_axes = returned_objects[1]
    potential_guides = returned_objects[2]
    
    
    """
    Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop
    """
    
    print 'Adding Motor 1'
    parts.append(geo)
    
    for i, tag in enumerate(potential_source_tags):
        if tag == source_tag_selection:
            pass
        else:
            target_axes.append(potential_axes[i])
            target_guides.append(potential_guides[i])
            target_tags.append(potential_target_tags[i])
    
    
    #Create next block
    count += 1
    next_part(parts, target_axes, target_guides, target_tags, count, nib_item)


def motor2(parts, target_axes, target_guides, target_tags, count, nib_item):
    """
    There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    """
    
    try:
        selection_index = selection_list[count]
    except:
        selection_index = 0
    
    
    """
    Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    Motor 1 has 6 possible placements: the side with the motor has 1 guide and can be placed left-handed 
    or right-handed the side without the motor can be left or right-handed with either of 2 guides. These 
    placements are all detailed below in Step 2
    """
    geo = motor2_geo.Duplicate()
    a_axis_1 = motor2_tube2a_axis_1.Duplicate()
    a_axis_2 = motor2_tube2a_axis_2.Duplicate()
    a_guide_1 = motor2_tube2a_guide_1.Duplicate()
    a_guide_2 = motor2_tube2a_guide_2.Duplicate()
    b_axis_1 = motor2_tube2b_axis_1.Duplicate()
    b_axis_2 = motor2_tube2b_axis_2.Duplicate()
    b_guide_1 = motor2_tube2b_guide_1.Duplicate()
    b_guide_2 = motor2_tube2b_guide_2.Duplicate()
    
    
    """
    Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function
    """
    source_tags = ['motor2_tube2_a', 'motor2_tube2_a', 'motor2_tube2_b', 'motor2_tube2_b']
    source_axes = [a_axis_1, a_axis_2, b_axis_1, b_axis_2]
    source_guides = [a_guide_1, a_guide_2, b_guide_1, b_guide_2]

    
    """
    Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    Once we know the source aixs and guide, we can ignore the remaining source geo b/c it's irrlevant
    We drop the other source geo and only transform the axes/guides that will form future targets (see next step)
    """
    pair_list = generate_selection_pairs(source_tags, target_tags)
    source_target_pair = pair_list[selection_index % len(pair_list)]
    source_tag_selection = source_tags[source_target_pair[0]] #a special name for a special tag (see final step)
    source_axis = source_axes[source_target_pair[0]]
    source_guide = source_guides[source_target_pair[0]]
    target_tag = target_tags.pop(source_target_pair[1])
    target_axis = target_axes.pop(source_target_pair[1])
    target_guide = target_guides.pop(source_target_pair[1])
    
    
    """
    Step 4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
    All of that geometry will be transformed according to the selected source/target geometry.
    Note that the .Duplicate() method is necessary to avoid Transforms on the same geometry
    We need potential_source_tags and potential_target_tags for the final step. 
    In the case of Motor1, there are 2 potential targets: a (with motor) and b (without)
    """
    potential_source_tags = ['motor2_tube2_a', 'motor2_tube2_b']
    potential_target_tags = [tag_motor2_tube2_a, tag_motor2_tube2_b]
    potential_axes = [a_axis_1.Duplicate(), b_axis_1.Duplicate()]
    potential_guides = [a_guide_1.Duplicate(), b_guide_1.Duplicate()]
    
    
    """
    Step 5. Transform 
    This is a relatively simple step for Tubes and Nibs, b/c geometry just needs to be oriented and moved to the target geo.
    It's slightly more complicated for Motors, because the additional rotation of the "motor" needs to be accounted for.
    Step 5A: Rotate Motor (and guides if necessary)
    Note that when the "motor" connection rotates around the target, the entire part and all axes/guides 
    will rotate with it. But we do NOT transform the source_guide, as we need to preserve a point of reference
    i.e. the change in position relative to the starting point in the local coordinates of the source geo
    """
    if source_tag_selection == "motor2_tube2_a":
        #Rotate around first axis
        axis_vector = rg.Vector3d(potential_axes[0].PointAt(1) - potential_axes[0].PointAt(0))
        rotation = rg.Transform.Rotation(rotation_sin_2, rotation_cos_2, axis_vector, potential_axes[0].PointAt(0))
        geo.Transform(rotation)
        potential_axes[1].Transform(rotation) #First axis doesn't rotate b/c everything is rotating around it
        potential_guides[0].Transform(rotation)
        potential_guides[1].Transform(rotation)
        #Rotate around second axis
        axis_vector = rg.Vector3d(potential_axes[1].PointAt(1) - potential_axes[1].PointAt(0))
        rotation = rg.Transform.Rotation(rotation_sin_2, rotation_cos_2, axis_vector, potential_axes[1].PointAt(0))
        potential_guides[1].Transform(rotation)
    else:
        #Rotate around first axis
        axis_vector = rg.Vector3d(potential_axes[1].PointAt(1) - potential_axes[1].PointAt(0))
        rotation = rg.Transform.Rotation(rotation_sin_2, rotation_cos_2, axis_vector, potential_axes[1].PointAt(0))
        geo.Transform(rotation)
        potential_axes[0].Transform(rotation) #Second axis doesn't rotate b/c everything is rotating around it
        potential_guides[0].Transform(rotation)
        potential_guides[1].Transform(rotation)
        #Rotate around second axis
        axis_vector = rg.Vector3d(potential_axes[0].PointAt(1) - potential_axes[0].PointAt(0))
        rotation = rg.Transform.Rotation(rotation_sin_2, rotation_cos_2, axis_vector, potential_axes[0].PointAt(0))
        potential_guides[0].Transform(rotation)
    
    #Step 5B: Add Motor to target geometry
    returned_objects = orient3d(geo, source_axis, source_guide, potential_axes, potential_guides, target_axis, target_guide)
    geo = returned_objects[0]
    potential_axes = returned_objects[1]
    potential_guides = returned_objects[2]
    
    
    """
    Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop
    """
    
    print 'Adding Motor 2'
    parts.append(geo)
    
    for i, tag in enumerate(potential_source_tags):
        if tag == source_tag_selection:
            pass
        else:
            target_axes.append(potential_axes[i])
            target_guides.append(potential_guides[i])
            target_tags.append(potential_target_tags[i])
    
    
    #Create next block
    count += 1
    next_part(parts, target_axes, target_guides, target_tags, count, nib_item)


def motor3(parts, target_axes, target_guides, target_tags, count, nib_item):
    """
    There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    """
    
    try:
        selection_index = selection_list[count]
    except:
        selection_index = 0
    
    
    """
    Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    Motor 1 has 6 possible placements: the side with the motor has 1 guide and can be placed left-handed 
    or right-handed the side without the motor can be left or right-handed with either of 2 guides. These 
    placements are all detailed below in Step 2
    """
    geo = motor3_geo.Duplicate()
    a_axis_1 = motor3_tube2a_axis_1.Duplicate()
    a_axis_2 = motor3_tube2a_axis_2.Duplicate()
    a_guide_1 = motor3_tube2a_guide_1.Duplicate()
    a_guide_2 = motor3_tube2a_guide_2.Duplicate()
    b_axis_1 = motor3_tube2b_axis_1.Duplicate()
    b_axis_2 = motor3_tube2b_axis_2.Duplicate()
    b_guide_1 = motor3_tube2b_guide_1.Duplicate()
    b_guide_2 = motor3_tube2b_guide_2.Duplicate()
    c_axis_1 = motor3_tube1_axis_1.Duplicate()
    c_axis_2 = motor3_tube1_axis_2.Duplicate()
    c_guide_1 = motor3_tube1_guide_1.Duplicate()
    c_guide_2 = motor3_tube1_guide_2.Duplicate()
    
    
    """
    Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function
    """
    source_tags = ['motor3_tube2_a', 'motor3_tube2_a', 'motor3_tube2_b', 'motor3_tube2_b', 'motor3_tube2_b', 'motor3_tube2_b', 'motor3_tube1', 'motor3_tube1', 'motor3_tube1', 'motor3_tube1']
    source_axes = [a_axis_1, a_axis_2, b_axis_1, b_axis_2, b_axis_1, b_axis_2, c_axis_1, c_axis_2, c_axis_1, c_axis_2]
    source_guides = [a_guide_1, a_guide_2, b_guide_1, b_guide_2, b_guide_2, b_guide_1, c_guide_1, c_guide_2, c_guide_2, c_guide_1]
    
    """
    Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    Once we know the source aixs and guide, we can ignore the remaining source geo b/c it's irrlevant
    We drop the other source geo and only transform the axes/guides that will form future targets (see next step)
    """
    pair_list = generate_selection_pairs(source_tags, target_tags)
    source_target_pair = pair_list[selection_index % len(pair_list)]
    source_tag_selection = source_tags[source_target_pair[0]] #a special name for a special tag (see final step)
    source_axis = source_axes[source_target_pair[0]]
    source_guide = source_guides[source_target_pair[0]]
    target_tag = target_tags.pop(source_target_pair[1])
    target_axis = target_axes.pop(source_target_pair[1])
    target_guide = target_guides.pop(source_target_pair[1])
    
    
    """
    Step 4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
    All of that geometry will be transformed according to the selected source/target geometry.
    Note that the .Duplicate() method is necessary to avoid Transforms on the same geometry
    We need potential_source_tags and potential_target_tags for the final step. 
    In the case of Motor1, there are 2 potential targets: a (with motor) and b (without)
    """
    potential_source_tags = ['motor3_tube2_a', 'motor3_tube2_b', 'motor3_tube1']
    potential_target_tags = [tag_motor3_tube2_a, tag_motor3_tube2_b, tag_motor3_tube1]
    potential_axes = [a_axis_1.Duplicate(), b_axis_1.Duplicate(), c_axis_1.Duplicate()]
    potential_guides = [a_guide_1.Duplicate(), b_guide_1.Duplicate(), c_guide_1.Duplicate()]
    
    
    """
    Step 5. Transform 
    This is a relatively simple step for Tubes and Nibs, b/c geometry just needs to be oriented and moved to the target geo.
    It's slightly more complicated for Motors, because the additional rotation of the "motor" needs to be accounted for.
    Step 5A: Rotate Motor (and guides if necessary)
    """
    axis_vector = rg.Vector3d(a_axis_1.PointAt(1) - a_axis_1.PointAt(0))
    rotation = rg.Transform.Rotation(rotation_sin_2, rotation_cos_2, axis_vector, a_axis_1.PointAt(0))
    #If the "motor" connection is selected as the source, then the entire part and all axes/guides will rotate with it
    #Note that we do NOT transform the source_guide, we need to preserve a point of reference
    #i.e. the change in position relative to the starting point in the local coordinates of the source geo
    if source_tag_selection == "motor3_tube2_a":
        geo.Transform(rotation)
        for axis in potential_axes: axis.Transform(rotation) #First axis doesn't rotate b/c everything is rotating around it
        for guide in potential_guides: guide.Transform(rotation)
    #Otherwise, the guide associated with the "motor" connection (and only this guide) wiil rotate in place
    else:
        potential_guides[0].Transform(rotation)
    
    #Step 5B: Add Motor to target geometry
    returned_objects = orient3d(geo, source_axis, source_guide, potential_axes, potential_guides, target_axis, target_guide)
    geo = returned_objects[0]
    potential_axes = returned_objects[1]
    potential_guides = returned_objects[2]
    
    
    """
    Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop
    """
    
    print 'Adding Motor 3'
    parts.append(geo)
    
    for i, tag in enumerate(potential_source_tags):
        if tag == source_tag_selection:
            pass
        else:
            target_axes.append(potential_axes[i])
            target_guides.append(potential_guides[i])
            target_tags.append(potential_target_tags[i])
    
    
    #Create next block
    count += 1
    next_part(parts, target_axes, target_guides, target_tags, count, nib_item)


def motor4(parts, target_axes, target_guides, target_tags, count, nib_item):
    """
    There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    """
    
    try:
        selection_index = selection_list[count]
    except:
        selection_index = 0
    
    
    """
    Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    Motor 1 has 6 possible placements: the side with the motor has 1 guide and can be placed left-handed 
    or right-handed the side without the motor can be left or right-handed with either of 2 guides. These 
    placements are all detailed below in Step 2
    """
    geo = motor4_geo.Duplicate()
    a_axis_1 = motor4_tube1a_axis_1.Duplicate()
    a_axis_2 = motor4_tube1a_axis_2.Duplicate()
    a_guide_1 = motor4_tube1a_guide_1.Duplicate()
    a_guide_2 = motor4_tube1a_guide_2.Duplicate()
    b_axis_1 = motor4_tube1b_axis_1.Duplicate()
    b_axis_2 = motor4_tube1b_axis_2.Duplicate()
    b_guide_1 = motor4_tube1b_guide_1.Duplicate()
    b_guide_2 = motor4_tube1b_guide_2.Duplicate()
    c_axis_1 = motor4_tube2_axis_1.Duplicate()
    c_axis_2 = motor4_tube2_axis_2.Duplicate()
    c_guide_1 = motor4_tube2_guide_1.Duplicate()
    c_guide_2 = motor4_tube2_guide_2.Duplicate()
    
    
    """
    Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function
    """
    source_tags = ['motor4_tube1_a', 'motor4_tube1_a', 'motor4_tube1_b', 'motor4_tube1_b', 'motor4_tube1_b', 'motor4_tube1_b', 'motor4_tube2', 'motor4_tube2', 'motor4_tube2', 'motor4_tube2']
    source_axes = [a_axis_1, a_axis_2, b_axis_1, b_axis_2, b_axis_1, b_axis_2, c_axis_1, c_axis_2, c_axis_1, c_axis_2]
    source_guides = [a_guide_1, a_guide_2, b_guide_1, b_guide_2, b_guide_2, b_guide_1, c_guide_1, c_guide_2, c_guide_2, c_guide_1]
    
    """
    Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    Once we know the source aixs and guide, we can ignore the remaining source geo b/c it's irrlevant
    We drop the other source geo and only transform the axes/guides that will form future targets (see next step)
    """
    pair_list = generate_selection_pairs(source_tags, target_tags)
    source_target_pair = pair_list[selection_index % len(pair_list)]
    source_tag_selection = source_tags[source_target_pair[0]] #a special name for a special tag (see final step)
    source_axis = source_axes[source_target_pair[0]]
    source_guide = source_guides[source_target_pair[0]]
    target_tag = target_tags.pop(source_target_pair[1])
    target_axis = target_axes.pop(source_target_pair[1])
    target_guide = target_guides.pop(source_target_pair[1])
    
    
    """
    Step 4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
    All of that geometry will be transformed according to the selected source/target geometry.
    Note that the .Duplicate() method is necessary to avoid Transforms on the same geometry
    We need potential_source_tags and potential_target_tags for the final step. 
    In the case of Motor1, there are 2 potential targets: a (with motor) and b (without)
    """
    potential_source_tags = ['motor4_tube1_a', 'motor4_tube1_b', 'motor4_tube2']
    potential_target_tags = [tag_motor4_tube1_a, tag_motor4_tube1_b, tag_motor4_tube2]
    potential_axes = [a_axis_1.Duplicate(), b_axis_1.Duplicate(), c_axis_1.Duplicate()]
    potential_guides = [a_guide_1.Duplicate(), b_guide_1.Duplicate(), c_guide_1.Duplicate()]
    
    
    """
    Step 5. Transform 
    This is a relatively simple step for Tubes and Nibs, b/c geometry just needs to be oriented and moved to the target geo.
    It's slightly more complicated for Motors, because the additional rotation of the "motor" needs to be accounted for.
    Step 5A: Rotate Motor (and guides if necessary)
    """
    axis_vector = rg.Vector3d(a_axis_1.PointAt(1) - a_axis_1.PointAt(0))
    rotation = rg.Transform.Rotation(rotation_sin_2, rotation_cos_2, axis_vector, a_axis_1.PointAt(0))
    #If the "motor" connection is selected as the source, then the entire part and all axes/guides will rotate with it
    #Note that we do NOT transform the source_guide, we need to preserve a point of reference
    #i.e. the change in position relative to the starting point in the local coordinates of the source geo
    if source_tag_selection == "motor4_tube1_a":
        geo.Transform(rotation)
        for axis in potential_axes: axis.Transform(rotation) #First axis doesn't rotate b/c everything is rotating around it
        for guide in potential_guides: guide.Transform(rotation)
    #Otherwise, the guide associated with the "motor" connection (and only this guide) wiil rotate in place
    else:
        potential_guides[0].Transform(rotation)
    
    #Step 5B: Add Motor to target geometry
    returned_objects = orient3d(geo, source_axis, source_guide, potential_axes, potential_guides, target_axis, target_guide)
    geo = returned_objects[0]
    potential_axes = returned_objects[1]
    potential_guides = returned_objects[2]
    
    
    """
    Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop
    """
    
    print 'Adding Motor 4'
    parts.append(geo)
    
    for i, tag in enumerate(potential_source_tags):
        if tag == source_tag_selection:
            pass
        else:
            target_axes.append(potential_axes[i])
            target_guides.append(potential_guides[i])
            target_tags.append(potential_target_tags[i])
    
    
    #Create next block
    count += 1
    next_part(parts, target_axes, target_guides, target_tags, count, nib_item)


def motor5(parts, target_axes, target_guides, target_tags, count, nib_item):
    """
    There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    """
    
    try:
        selection_index = selection_list[count]
    except:
        selection_index = 0
    
    
    """
    Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    Motor 1 has 6 possible placements: the side with the motor has 1 guide and can be placed left-handed 
    or right-handed the side without the motor can be left or right-handed with either of 2 guides. These 
    placements are all detailed below in Step 2
    """
    geo = motor5_geo.Duplicate()
    a_axis_1 = motor5_tube1a_axis_1.Duplicate()
    a_axis_2 = motor5_tube1a_axis_2.Duplicate()
    a_guide_1 = motor5_tube1a_guide_1.Duplicate()
    a_guide_2 = motor5_tube1a_guide_2.Duplicate()
    b_axis_1 = motor5_tube1b_axis_1.Duplicate()
    b_axis_2 = motor5_tube1b_axis_2.Duplicate()
    b_guide_1 = motor5_tube1b_guide_1.Duplicate()
    b_guide_2 = motor5_tube1b_guide_2.Duplicate()
    c_axis_1 = motor5_tube2_axis_1.Duplicate()
    c_axis_2 = motor5_tube2_axis_2.Duplicate()
    c_guide_1 = motor5_tube2_guide_1.Duplicate()
    c_guide_2 = motor5_tube2_guide_2.Duplicate()
    
    
    """
    Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function
    """
    source_tags = ['motor5_tube1_a', 'motor5_tube1_a', 'motor5_tube1_b', 'motor5_tube1_b', 'motor5_tube1_b', 'motor5_tube1_b', 'motor5_tube2', 'motor5_tube2', 'motor5_tube2', 'motor5_tube2']
    source_axes = [a_axis_1, a_axis_2, b_axis_1, b_axis_2, b_axis_1, b_axis_2, c_axis_1, c_axis_2, c_axis_1, c_axis_2]
    source_guides = [a_guide_1, a_guide_2, b_guide_1, b_guide_2, b_guide_2, b_guide_1, c_guide_1, c_guide_2, c_guide_2, c_guide_1]
    
    """
    Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    Once we know the source aixs and guide, we can ignore the remaining source geo b/c it's irrlevant
    We drop the other source geo and only transform the axes/guides that will form future targets (see next step)
    """
    pair_list = generate_selection_pairs(source_tags, target_tags)
    source_target_pair = pair_list[selection_index % len(pair_list)]
    source_tag_selection = source_tags[source_target_pair[0]] #a special name for a special tag (see final step)
    source_axis = source_axes[source_target_pair[0]]
    source_guide = source_guides[source_target_pair[0]]
    target_tag = target_tags.pop(source_target_pair[1])
    target_axis = target_axes.pop(source_target_pair[1])
    target_guide = target_guides.pop(source_target_pair[1])
    
    
    """
    Step 4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
    All of that geometry will be transformed according to the selected source/target geometry.
    Note that the .Duplicate() method is necessary to avoid Transforms on the same geometry
    We need potential_source_tags and potential_target_tags for the final step. 
    In the case of Motor1, there are 2 potential targets: a (with motor) and b (without)
    """
    potential_source_tags = ['motor5_tube1_a', 'motor5_tube1_b', 'motor5_tube2']
    potential_target_tags = [tag_motor5_tube1_a, tag_motor5_tube1_b, tag_motor5_tube2]
    potential_axes = [a_axis_1.Duplicate(), b_axis_1.Duplicate(), c_axis_1.Duplicate()]
    potential_guides = [a_guide_1.Duplicate(), b_guide_1.Duplicate(), c_guide_1.Duplicate()]
    
    
    """
    Step 5. Transform 
    This is a relatively simple step for Tubes and Nibs, b/c geometry just needs to be oriented and moved to the target geo.
    It's slightly more complicated for Motors, because the additional rotation of the "motor" needs to be accounted for.
    Step 5A: Rotate Motor (and guides if necessary)
    """
    axis_vector = rg.Vector3d(a_axis_1.PointAt(1) - a_axis_1.PointAt(0))
    rotation = rg.Transform.Rotation(rotation_sin_2, rotation_cos_2, axis_vector, a_axis_1.PointAt(0))
    #If the "motor" connection is selected as the source, then the entire part and all axes/guides will rotate with it
    #Note that we do NOT transform the source_guide, we need to preserve a point of reference
    #i.e. the change in position relative to the starting point in the local coordinates of the source geo
    if source_tag_selection == "motor5_tube1_a":
        geo.Transform(rotation)
        for axis in potential_axes: axis.Transform(rotation) #First axis doesn't rotate b/c everything is rotating around it
        for guide in potential_guides: guide.Transform(rotation)
    #Otherwise, the guide associated with the "motor" connection (and only this guide) wiil rotate in place
    else:
        potential_guides[0].Transform(rotation)
    
    #Step 5B: Add Motor to target geometry
    returned_objects = orient3d(geo, source_axis, source_guide, potential_axes, potential_guides, target_axis, target_guide)
    geo = returned_objects[0]
    potential_axes = returned_objects[1]
    potential_guides = returned_objects[2]
    
    
    """
    Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    In the final step, we drop the potential_tag/axis/guide that corresponds to the original source_tag_selection
    i.e. if tube3_a_outer is placed in a motor, then don't add the corresponding tag/axis/guide to the available targets list
    Note: for tubes 2/3, this step is still necessary, despite explicitly defining the potential_target axes/guides above
    If the target is tube 1, then technically this step isn't necessary, but for any other target part this is still
    the only way to know which potential_target_axis/guide to drop
    """
    
    print 'Adding Motor 5'
    parts.append(geo)
    
    for i, tag in enumerate(potential_source_tags):
        if tag == source_tag_selection:
            pass
        else:
            target_axes.append(potential_axes[i])
            target_guides.append(potential_guides[i])
            target_tags.append(potential_target_tags[i])
    
    
    #Create next block
    count += 1
    next_part(parts, target_axes, target_guides, target_tags, count, nib_item)


def nib(parts, target_axes, target_guides, target_tags, count, nib_item):
    """
    There are 6 main steps to placing a part:
    1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    2. Create source_tag/axis/guide pairs
    3. Run generate_selection_pairs() to select source_ and target_axis/guides
    4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically fewer options than the source placements)
    5. Transform (orient and rotate) mesh and all potential_target geo
    6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    """
    
    try:
        selection_index = selection_list[count]
    except:
        selection_index = 0
    
    
    """
    Step 1. Define source geometry (these are duplicates of the globals defined by Rhino GUIDs)
    Motor 1 has 6 possible placements: the side with the motor has 1 guide and can be placed left-handed 
    or right-handed the side without the motor can be left or right-handed with either of 2 guides. These 
    placements are all detailed below in Step 2
    """
    geo = nib_geo.Duplicate()
    point = nib_pt.Duplicate()
    tube1_axis_1 = nib_tube1_axis_1.Duplicate()
    tube1_axis_2 = nib_tube1_axis_2.Duplicate()
    tube1_guide_1 = nib_tube1_guide_1.Duplicate()
    tube2_axis_1 = nib_tube2_axis_1.Duplicate()
    tube2_axis_2 = nib_tube2_axis_2.Duplicate()
    tube2_guide_1 = nib_tube2_guide_1.Duplicate()
    motors1_axis_1 = nib_motors1_axis_1.Duplicate()
    motors1_axis_2 = nib_motors1_axis_2.Duplicate()
    motors2_axis_1 = nib_motors2_axis_1.Duplicate()
    motors2_axis_2 = nib_motors2_axis_2.Duplicate()
    motors1_guide_1 = nib_motors1_guide_1.Duplicate()
    motors2_guide_1 = nib_motors2_guide_1.Duplicate()
    
    """
    Step 2. Create source_tag/axis/guide pairs
    The source_tags will be compared to available target_tags, and the selection_index will be used to choose from the available pairings
    The chosen source and target axes/guides will be used to create the transforms
    The transforms will be applied to the mesh and the future_target geometry
    Note: there are two different kinds of tags: source_tags describe the geometry of the part to be placed ("tube2_a_outer", "motor2_tube2_a"),
    target_tags describe all the types of source geometry that can be accepted by the receiving part (a much longer string of concatenated source tags)
    This system allows for easy creation of source/target pairs for potential placement of new parts with the generate_selection_pairs() function
    """
    source_tags = ['nib_tube1_a', 'nib_tube1_b', 'nib_tube2_a', 'nib_tube2_b', 'nib_motors_1', 'nib_motors_1', 'nib_motors_2', 'nib_motors_2']
    source_axes = [tube1_axis_1, tube1_axis_2, tube2_axis_1, tube2_axis_2, motors1_axis_1, motors1_axis_2, motors2_axis_1, motors2_axis_2]
    source_guides = [tube1_guide_1, tube1_guide_1, tube2_guide_1, tube2_guide_1, motors1_guide_1, motors1_guide_1, motors2_guide_1, motors2_guide_1]
    
    """
    Step 3. Run generate_selection_pairs() to select source_ and target_axis/guides
    Once we know the source aixs and guide, we can ignore the remaining source geo b/c it's irrlevant
    We drop the other source geo and only transform the axes/guides that will form future targets (see next step)
    """
    pair_list = generate_selection_pairs(source_tags, target_tags)
    source_target_pair = pair_list[selection_index % len(pair_list)]
    source_tag_selection = source_tags[source_target_pair[0]] #a special name for a special tag (see final step)
    source_axis = source_axes[source_target_pair[0]]
    source_guide = source_guides[source_target_pair[0]]
    target_tag = target_tags.pop(source_target_pair[1])
    target_axis = target_axes.pop(source_target_pair[1])
    target_guide = target_guides.pop(source_target_pair[1])
    
    
    """
    Step 4. Repeat step 2 to define potential_target pairs (also taken from Rhino geometry, but typically different than the source placements)
    Simple for Nibs, because they don't add any new targets
    """
    potential_source_tags = []
    potential_target_tags = []
    potential_axes = [point]
    potential_guides = []
    
    
    """
    Step 5. Transform 
    This is a relatively simple step for Tubes and Nibs, b/c geometry just needs to be oriented and moved to the target geo.
    It's slightly more complicated for Motors, because the additional rotation of the "motor" needs to be accounted for.
    """
    returned_objects = orient3d(geo, source_axis, source_guide, potential_axes, potential_guides, target_axis, target_guide)
    geo = returned_objects[0]
    point = returned_objects[1][0]
    
    
    """
    Step 6. Drop potential_target geo corresponding to selection (it's already been used) and modify master lists (parts/tags/axes/guides)
    Nibs don't add any new targets, so there's no need to iterate over the potential_source_tags for tags/axes/guides as with other parts.
    However, if Nib is placed in a Tube 2/3 inner position, then we have to remove the corresponding Tube 2/3 outer tag so that a Tube 1 
    can't be placed over it (but a Motor still could)
    """
    
    print 'Adding Nib'
    parts.append(geo)
    
    #Step A: confirm target is Tube 2/3
    if target_tag == "nib_tube2_a" or target_tag == "nib_tube2_b":
        #Step B: confirm which outer tag is referenced (could be tube2_a, tube2_b, tube3_a, or tube3_b)
        if target_tags[source_target_pair[1] - 1] == tag_tube2_a_outer or target_tags[source_target_pair[1] - 1] == tag_tube2_b_outer or target_tags[source_target_pair[1] - 1] == tag_tube3_a_outer or target_tags[source_target_pair[1] - 1] == tag_tube3_b_outer:
            #Step C: define new target that removes tube1_outer as possible placement
            target_tags[source_target_pair[1] - 1] = "motor1_tube2_a, motor1_tube2_b, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a, motor3_tube2_b, motor4_tube2, motor5_tube2"
    
    
    #Add nib_pt to traces_points
    #This is the method for exporting one point per Nib for any given angle
    #Points are then recorded in Grasshopper and converted into lines
    path = GH_Path(nib_item)
    manual_points.Add(point, path)
    """
    #Previously: when machine in "run" mode, this was the process for recording points
    #Presumably, this method will work in JS
    if rotation_angle == 0:
        trace_point = [nib_pt]
        traces_points.append(trace_point)
    else:
        traces_points[nib_item].append(nib_pt)
    nib_item += 1     
    """
    
    #nib_item refers to reach individual nib
    #traces_points is a list of lists, and each list contains the points for a particular nib
    #note how the initial point for each nib (when rotation_angle == 0) is added to traces_points as [nib_pt]
    #so nib_item locates that particular nib
    
    #Create next block
    count += 1
    next_part(parts, target_axes, target_guides, target_tags, count, nib_item)


#----------Run Script-----------------------------------------------------------------------------------------------------------------------------------------------


#Build machine
parts, axes, guides = base()
points = manual_points

#Previously, when machine was in "run" mode, this is how collected points were converted into lines
#for i in range(721):
#    rotation_angle = i * 0.0698132 #Convert to radians (i = 4 degrees)
#    parts = base()
#    block_edges = get_edges(parts)
#    block_meshes = get_meshes(parts)
#    
#for point_list in traces_points:
#    trace = rg.Curve.CreateControlPointCurve(point_list)
#    traces_lines.append(trace)