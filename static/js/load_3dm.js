/*A BRIEF INTRODUCTION
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
when the user clicks "DRAW" the machine will run and the Nibs will trace out the drawing.*/




//------------------------------------------Declare Variables-------------------------------------------------------------------------------------------------------------------------------------

//There are a LOT of variables because we're referencing a LOT of specific geometry in the Rhino doc

// General Inputs
var part_list_input = []; //Array of part names (i.e. ["Tube 3", "Motor 1"...]) used to trigger associated functions
var part_list_output = []; //Array of geometry to add/render to scene
var pair_list //Array of potential source/target pairs. Global b/c needs to be accessed by previousButton() in functions.js
var selection_list = [];
var selection_index = 0;
var count = 0;
var nib_item = 0;
var traces_points = [];
var target_axes = [];
var target_guides = [];
var target_tags = [];

var rotation_angle = 0;
var current_angle = 0; //This is to capture the angle from the manual slider, so that it can be returned to with reset_animation()
var rotation_increment = 1.5;

/*Motors are intended to rotate at different speeds. The default settings are that motors with larger (i.e. Tube 1)
connections will rotate at roughly half the speed of smaller (i.e. Tubes 2 and 3) connections.*/
var angle_factor_A = 1.1;
var angle_factor_B = 1.9;
var angle_A = 0;
var angle_B = 0;

var play_bool = true; 
var draw_bool = false;
var play_count = 0;
// var max_play_count = 300;

var window_width = window.screen.availWidth;
var window_height = window.screen.availHeight;

/*Each part (base, tube, motor, nib, etc.) and all of its source geometry is read in as a var variable.
Inner and Outer placements for Tubes share the same geometry and can be created in the part's function
Target geometry is always a duplicate of singular pairs of tags/axes/guides and can be created in the part's function
Naming convention for tags is: PartName_Connection_Type_Selection, so "tube3_a_axis_1" is the first axis on the
A end of Tube 3. Similarly, "motor1_tube2b_guide_2" is the second guide option for the second Tube 2 connection
for Motor 1.*/

//Base is simple because it's already in place
var base_sphere;
var base_tube;
var base_axis;
var base_guide;

//Tube 1 is the simplest of the Tubes with only 2 possible placements:
//2 axes (ends A and B) x 1 guide each. 
var tube1_geo;
var tube1_a_axis_1;
var tube1_a_guide_1;
var tube1_b_axis_1;
var tube1_b_guide_1;

/*Tube 2 is the only tube with a mid-point, so 3 possible placements:
3 axes (end A, middle, and end B) x 1 guide each. Note that A and B are
used to represent the ends on the other tubes, so we use "mid" for Tube 2
instead of changing to A, B, and C.*/
var tube2_geo;
var tube2_a_axis_1;
var tube2_a_guide_1;
var tube2_mid_axis_1;
var tube2_mid_guide_1;
var tube2_b_axis_1;
var tube2_b_guide_1;

/*Tube 3 is the only tube where orientation matters (b/c of its asymmetrical bend)
and has 8 possible placements: 2 axes (1 for each end of the tube) x 4 guides
each, for 0, 90, 180, or 270 degrees*/
var tube3_geo;
var tube3_a_axis_1;
var tube3_a_guide_1;
var tube3_a_guide_2;
var tube3_a_guide_3;
var tube3_a_guide_4;
var tube3_b_axis_1;
var tube3_b_guide_1;
var tube3_b_guide_2;
var tube3_b_guide_3;
var tube3_b_guide_4;

/*Motor 1 has 6 possible placements. Connection A has the motor that drives rotation, so
it can be placed along a right-handed or left-handed axis, but doesn't care about 0, 9, 180, 270 
degrees, so each axis only has 1 guide (note that there is a different guide for each axis so that when the
motor is flipped, connection B stays in the same orientation). Connection B doesn't rotate, but its orientation 
still determines the handedness of A as a target for future geometry, so it has 2 axes x 2 orientations for 
0 and 180 degrees.*/
var motor1_geo;
var motor1_tube2a_axis_1;
var motor1_tube2a_axis_2;
var motor1_tube2a_guide_1;
var motor1_tube2a_guide_2;
var motor1_tube2b_axis_1;
var motor1_tube2b_axis_2;
var motor1_tube2b_guide_1;
var motor1_tube2b_guide_2;

/*Motor 2 has 4 possible placements. Connection A and B both have motors that drive rotation, so
they can be placed along a right-handed or left-handed axis, but don't care about 0, 9, 180, 270 
degrees, so each axis only has 1 guide (note that there is a different guide for each axis so that when the
motor is flipped, the other connection stays in the same orientation).*/
var motor2_geo;
var motor2_tube2a_axis_1;
var motor2_tube2a_axis_2;
var motor2_tube2a_guide_1;
var motor2_tube2a_guide_2;
var motor2_tube2b_axis_1;
var motor2_tube2b_axis_2;
var motor2_tube2b_guide_1;
var motor2_tube2b_guide_2;

/*Motor 3 has 10 possible placements. Connection tube2a has the motor that drives rotation, so
it can be placed along a right-handed or left-handed axis, but doesn't care about 0, 9, 180, 270 
degrees, so each axis only has 1 guide (note that there is a different guide for each axis so that when the
motor is flipped, the other connections stay in the same orientation). Connection tube2b ("b" because it is
the second possible location for a tube 2 or 3) doesn't rotate, but its orientation still determines the 
handedness of tube2a as a target for future geometry, so it has 2 axes x 2 orientations for 0 and 180 degrees. 
Connection tube1 is just like tube2b, except that it accepts Tube 1 instead of Tube 2 or 3.*/
var motor3_geo;
var motor3_tube2a_axis_1;
var motor3_tube2a_axis_2;
var motor3_tube2a_guide_1;
var motor3_tube2a_guide_2;
var motor3_tube2b_axis_1;
var motor3_tube2b_axis_2;
var motor3_tube2b_guide_1;
var motor3_tube2b_guide_2;
var motor3_tube1_axis_1;
var motor3_tube1_axis_2;
var motor3_tube1_guide_1;
var motor3_tube1_guide_2;

/*Motor 4 has 10 possible placements. Connection tube1a has the motor that drives rotation, so
it can be placed along a right-handed or left-handed axis, but doesn't care about 0, 9, 180, 270 
degrees, so each axis only has 1 guide (note that there is a different guide for each axis so that when the
motor is flipped, the other connections stay in the same orientation). Connection tube1b ("b" because it is
the second possible location for a tube 1) doesn't rotate, but its orientation still determines the 
handedness of tube1a as a target for future geometry, so it has 2 axes x 2 orientations for 0 and 180 degrees. 
Connection tube2 is just like tube1b, except that it accepts Tubes 2/3 instead of Tube 1.*/
var motor4_geo;
var motor4_tube1a_axis_1;
var motor4_tube1a_axis_2;
var motor4_tube1a_guide_1;
var motor4_tube1a_guide_2;
var motor4_tube1b_axis_1;
var motor4_tube1b_axis_2;
var motor4_tube1b_guide_1;
var motor4_tube1b_guide_2;
var motor4_tube2_axis_1;
var motor4_tube2_axis_2;
var motor4_tube2_guide_1;
var motor4_tube2_guide_2;

/*Motor 5 has 10 possible placements. Connection tube1a has the motor that drives rotation, so
it can be placed along a right-handed or left-handed axis, but doesn't care about 0, 9, 180, 270 
degrees, so each axis only has 1 guide (note that there is a different guide for each axis so that when the
motor is flipped, the other connections stay in the same orientation). Connection tube1b ("b" because it is
the second possible location for a tube 1) doesn't rotate, but its orientation still determines the 
handedness of tube1a as a target for future geometry, so it has 2 axes x 2 orientations for 0 and 180 degrees. 
Connection tube2 is just like tube1b, except that it accepts Tubes 2/3 instead of Tube 1.*/
var motor5_geo;
var motor5_tube1a_axis_1;
var motor5_tube1a_axis_2;
var motor5_tube1a_guide_1;
var motor5_tube1a_guide_2;
var motor5_tube1b_axis_1;
var motor5_tube1b_axis_2;
var motor5_tube1b_guide_1;
var motor5_tube1b_guide_2;
var motor5_tube2_axis_1;
var motor5_tube2_axis_2;
var motor5_tube2_guide_1;
var motor5_tube2_guide_2;

/*Nibs trace out the lines that the drawing machine "draws". On one hand, they are fairly simple: there's the 
mesh (or geo), a point whose location is recorded to create the drawn lines, and a plug that tapers down from
the width of the inside of Tube 1 (where Tubes 2/3 are also plugged in) to the width of the inside of Tubes 2/3
(the whole reason that Tubes 2/3 have an inner plug is to accept Nibs). This allows Nibs to be placed anywhere 
that Tubes 2/3 can be placed, as well as into either end of Tubes 2/3 themselves.
The thing that makes Nibs complicated is that the Motors are not all the same size, resulting in more axes and guides 
than should be necessary.*/
var nib_geo;
var nib_pt;
var nib_tube1_axis_1;
var nib_tube1_axis_2;
var nib_tube1_guide1;
var nib_tube2_axis_1;
var nib_tube2_axis_2;
var nib_tube2_guide_1;
var nib_motors1_axis_1; //For direction 1 in non-rotating placements in motors
var nib_motors1_axis_2; //For direction 2 in non-rotating placements in motors
var nib_motors2_axis_1; //For direction 1 in rotating placements in motors
var nib_motors2_axis_2; //For direction 1 in rotating placements in motors
var nib_motors1_guide_1; 
var nib_motors2_guide_1;


/*Next, each geometry variable is paired with its Rhino object. This is done by iterating over each 
object in the Rhino document, checking its unique GUID, and pairing it with the appropriate variable.*/
var guid_base_sphere = '97b05396-34d4-44d9-93c2-9e4f7d1dd25e';
var guid_base_tube = '2e7684b7-6204-4f51-be33-730410920f35';
var guid_base_axis = 'cc4d087d-b190-492d-a1dd-30fcea4b304c';
var guid_base_guide = 'd12c3e0e-d53b-4787-a606-59ebcb415449';

var guid_tube1_geo = '65235b50-881c-4a56-8321-6c36085c9808';
var guid_tube1_a_axis_1 = '869fdf2e-0b29-4b8b-9e35-0184a4e5db98';
var guid_tube1_a_guide_1 = '604360b7-330c-4772-aeee-4226ce7d23d3';
var guid_tube1_b_axis_1 = '5ea1588f-62dc-4958-9f16-5291f83e6151';
var guid_tube1_b_guide_1 = '11e8391e-4575-440d-b0c4-6a91f15e221e';

var guid_tube2_geo = '8cd04cf0-da56-4754-bd73-c919f0614f4a';
var guid_tube2_a_axis_1 = 'e71299db-93e8-4bd3-92c8-4493057f2f14';
var guid_tube2_a_guide_1 = '31a42eaf-ff49-4f48-8942-a7854b20c445';
var guid_tube2_mid_axis_1 = '600196e2-14a8-49ce-8dfb-af6d3dfec5ef';
var guid_tube2_mid_guide_1 = '457c4692-c26b-4d5e-b79b-a271c40b98fd';
var guid_tube2_b_axis_1 = 'b9312cca-d859-488f-ada8-dfb360db3b30';
var guid_tube2_b_guide_1 = '7343890b-1be2-4e28-9d57-2f498ab59fbd';

var guid_tube3_geo = '39541263-d316-4544-8117-3123e0f6f29c';
var guid_tube3_a_axis_1 = '0a87114f-0349-4bdf-b8ba-ce9a9a89ad58';
var guid_tube3_a_guide_1 = 'df779ead-c6b0-4fbe-88cb-06f7c29724e0';
var guid_tube3_a_guide_2 = '5cbaa5f3-5d8c-4a21-84ea-f080d115c76c';
var guid_tube3_a_guide_3 = '1b539d36-a7ad-45e4-a7e9-f69aab90511e';
var guid_tube3_a_guide_4 = 'e4f43cb0-6bea-4234-a11f-df7adf241703';
var guid_tube3_b_axis_1 = '2d0cb88d-9820-459b-b0a9-1553e87e1a8c';
var guid_tube3_b_guide_1 = '415f134e-f3d1-45ee-8e63-cd1e930003bd';
var guid_tube3_b_guide_2 = '2064f76d-9536-43c8-a016-c1772c7cee40';
var guid_tube3_b_guide_3 = '52246726-e947-4f0b-aa3f-49ca771dfbb1';
var guid_tube3_b_guide_4 = 'a55e04db-3c76-4e94-bb9a-77e03285808b';

var guid_motor1_geo = 'cbaedd7f-4ca7-474e-a9c0-2ec264437606';
var guid_motor1_tube2a_axis_1 = 'd87049ac-8ab9-4b84-922e-0f909f178253';
var guid_motor1_tube2a_axis_2 = '26b68b5b-17b2-4e69-b55b-fb9fb6f90456';
var guid_motor1_tube2a_guide_1 = '5cc68bff-2f21-4876-94e1-e7042efd7225';
var guid_motor1_tube2a_guide_2 = 'a5b06d1b-191c-41b7-a8c8-ad5990abe3c9';
var guid_motor1_tube2b_axis_1 = '815db08a-f4f8-4ace-87b7-d0f7a51b26cd';
var guid_motor1_tube2b_axis_2 = 'de923821-cf5d-42e6-b0d0-96184901bb91';
var guid_motor1_tube2b_guide_1 = '70815750-23f6-4b7b-b146-7d87da127349';
var guid_motor1_tube2b_guide_2 = '7afaa2c0-5b3c-49e7-a242-13b74d25e46e';

var guid_motor2_geo = '6b3b4fb6-b0c5-476a-a0cb-925194c0b693';
var guid_motor2_tube2a_axis_1 = '7ec16399-062b-43b5-8aba-b5c5b63a1904';
var guid_motor2_tube2a_axis_2 = 'ca6ba297-e809-4dda-928b-9a21566fff81';
var guid_motor2_tube2a_guide_1 = 'baf8614f-ae9b-4296-9653-c9acfc9463e2';
var guid_motor2_tube2a_guide_2 = 'e3d5e76b-9258-4bba-8782-ba423df56031';
var guid_motor2_tube2b_axis_1 = 'f268259a-5b26-4ff4-9fb5-18ad33ecd96a';
var guid_motor2_tube2b_axis_2 = 'd6f2659b-8348-4b7f-9dd3-d4e734dcada3';
var guid_motor2_tube2b_guide_1 = 'd669698d-8bff-46d1-9998-5b98471e9694';
var guid_motor2_tube2b_guide_2 = '8b1206a0-acc2-474a-b486-1c418c68c98b';

var guid_motor3_geo = '35b7e82e-babd-462f-93a6-471dcb2410dd';
var guid_motor3_tube2a_axis_1 = '9827a61b-150e-4662-8949-0aeddbc5a0d7';
var guid_motor3_tube2a_axis_2 = '773a9227-77de-4732-a685-255afc656a47';
var guid_motor3_tube2a_guide_1 = 'dcba8bb5-0a0a-4a72-ba12-fe9fef6d7a3b';
var guid_motor3_tube2a_guide_2 = '4cd557e3-b282-4c33-a0d5-d600344177e4';
var guid_motor3_tube2b_axis_1 = 'f7c4568f-10cc-4147-9936-f9ed3ea441a0';
var guid_motor3_tube2b_axis_2 = 'bd053046-bd15-4a95-a6cb-477bdc44e064';
var guid_motor3_tube2b_guide_1 = '0c18822a-acb0-44bf-a996-25425fe8ccf4';
var guid_motor3_tube2b_guide_2 = '9b34971d-2a89-45bf-b288-b2d3bd020a10';
var guid_motor3_tube1_axis_1 = 'ce3966b2-1c01-4fd8-b733-9ba5f4a13ab9';
var guid_motor3_tube1_axis_2 = '72b9e06d-00e1-46d0-807d-7bfb4509138d';
var guid_motor3_tube1_guide_1 = '1440ce39-0a21-46b6-a5d1-7ede789b0056';
var guid_motor3_tube1_guide_2 = '26fbf4ed-33b8-43b2-b606-1f6ad42edd7a';

var guid_motor4_geo = '01e91a80-950c-4c33-b0ac-d137b270fb79';
var guid_motor4_tube1a_axis_1 = '644e5856-31d5-485a-8685-abd3c3717e0d';
var guid_motor4_tube1a_axis_2 = '73ef2088-1d43-43c7-b3c4-fc16617907c7';
var guid_motor4_tube1a_guide_1 = 'ea0f086e-14f9-47a1-b950-484d95b652fe';
var guid_motor4_tube1a_guide_2 = '2920a97b-0755-4078-98de-347f552cf7cb';
var guid_motor4_tube1b_axis_1 = '7a1c9242-6322-4dff-9c4c-648cad5da272';
var guid_motor4_tube1b_axis_2 = 'e278324e-6cf4-412e-8944-e55fd7e34942';
var guid_motor4_tube1b_guide_1 = '949a31a0-3836-4875-aeb8-1c3d514f0395';
var guid_motor4_tube1b_guide_2 = 'e05ee1db-c8f5-4ac8-97c1-43706316ff7f';
var guid_motor4_tube2_axis_1 = 'a378c7e2-6128-4031-80dc-6c09572fb4ca';
var guid_motor4_tube2_axis_2 = '51259bad-98a0-4e43-88c3-9a6961b40a51';
var guid_motor4_tube2_guide_1 = '921723d6-5607-43c8-9261-321964b0e0c8';
var guid_motor4_tube2_guide_2 = '970f9036-7518-4943-b8c8-0350e36bcd57';

var guid_motor5_geo = '7959e07c-073b-4ae3-9085-fd4eb1a64d4f';
var guid_motor5_tube1a_axis_1 = '747a447d-ea08-45fe-b688-8b69e94cd1a8';
var guid_motor5_tube1a_axis_2 = '17eeea6e-6882-42e5-aacb-a05c556c96b8';
var guid_motor5_tube1a_guide_1 = 'a950d3a3-91b7-476d-a5ca-8934c7aaf091';
var guid_motor5_tube1a_guide_2 = '37fbff06-6e55-440f-b0df-d8b2f8dd690e';
var guid_motor5_tube1b_axis_1 = '72121828-30fb-4e60-b14d-ab799ecc437f';
var guid_motor5_tube1b_axis_2 = '6cec41f9-af81-45af-9e85-b883f284aeac';
var guid_motor5_tube1b_guide_1 = '6435980a-e8d6-4213-b6ef-7d9d834e0e5e';
var guid_motor5_tube1b_guide_2 = '5d72c9f8-deb0-492b-94b2-6a9594fac9ba';
var guid_motor5_tube2_axis_1 = '5f406a7f-3a05-40b8-91ec-44cf04132cc5';
var guid_motor5_tube2_axis_2 = '3e7e29e3-0dc7-406f-b0ae-b7ba078762df';
var guid_motor5_tube2_guide_1 = 'bfa66d13-8af2-44af-b147-9cedf04d7efb';
var guid_motor5_tube2_guide_2 = 'cd949e11-fa56-44df-bd9c-c75d50cdd37d';

var guid_nib_geo = '991612b7-9699-4abe-bc9b-99ddf5098854';
var guid_nib_pt = '92657b99-21a1-4efa-ad06-c56247726c7e';
var guid_nib_tube2_axis_1 = 'd88f9519-939c-4293-8139-ad176efd6e48';
var guid_nib_tube2_axis_2 = '5f3e532e-059c-42d4-b808-75ca54fb287b';
var guid_nib_tube2_guide_1 = '51b71f31-9b26-4961-9cc7-9354fd13a3da';
var guid_nib_tube1_axis_1 = '7b8394b1-902a-4207-b634-a19ffa79e45d';
var guid_nib_tube1_axis_2 = 'a57ebc3c-cdb4-4074-9c43-66bd01dd4291';
var guid_nib_tube1_guide_1 = 'f2a213a6-5fee-4097-b547-4cf9cb6e0c69';
var guid_nib_motors1_axis_1 = 'd56c673f-2021-4078-bab9-f6d9f4ed8b9e';
var guid_nib_motors1_axis_2 = '03ce8a0f-9f7a-46f0-b542-85e0161e02db';
var guid_nib_motors2_axis_1 = '2a84a5ca-6598-480d-8f8e-fa7c40ba7788';
var guid_nib_motors2_axis_2 = '0a45a967-efb4-4e46-8910-ed3660966681';
var guid_nib_motors1_guide_1 = '043d467f-b31c-4372-8fa4-fd90ece65c2d';
var guid_nib_motors2_guide_1 = 'b3a0cc74-0854-464f-8e68-af8dd777bcb0';




//------------------------------------------Tags-------------------------------------------------------------------------------------------------------------------------------------

/*Tags are, without a doubt, the wonkiest part of this entire project...
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

Note that the Base geometry does not receive unique tags.
Tubes 2/3 will drop the source axes/guides for their inner placement (i.e. available for Nibs) 
when they are placed inside Tube 1, but that logic will need to be updated in order to to also 
drop the inner axes/guides if placed in the Base. Otherwise a Nib will be allowed
to be placed in the end of a Tube 2/3 that is already inside the Base. 

The alternative, current implementation, is to use the Tube 1 tags for the Base, with the only 
drawback being that a Nib can be placed in the Base, which can't draw a line b/c it just rotates 
around a single point.*/

var tag_tube1_a_outer = "motor3_tube1, motor4_tube1_a, motor4_tube1_b, motor5_tube1_a, motor5_tube1_b"; 
var tag_tube1_a_inner = "tube2_b_outer, tube3_b_outer, nib_tube1_a";
var tag_tube1_b_outer = "motor3_tube1, motor4_tube1_a, motor4_tube1_b, motor5_tube1_a, motor5_tube1_b";
var tag_tube1_b_inner = "tube2_a_outer, tube3_a_outer, nib_tube1_b";

var tag_tube2_a_outer = "tube1_b_inner, motor1_tube2_a, motor1_tube2_b, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a, motor3_tube2_b, motor4_tube2, motor5_tube2";
var tag_tube2_a_inner = "nib_tube2_a";
var tag_tube2_mid_outer = "motor1_tube2_a, motor1_tube2_b, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a, motor3_tube2_b, motor4_tube2, motor5_tube2";
var tag_tube2_b_outer = "tube1_a_inner, motor1_tube2_a, motor1_tube2_b, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a, motor3_tube2_b, motor4_tube2, motor5_tube2";
var tag_tube2_b_inner = "nib_tube2_b";

var tag_tube3_a_outer = "tube1_b_inner, motor1_tube2_a, motor1_tube2_b, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a, motor3_tube2_b, motor4_tube2, motor5_tube2";
var tag_tube3_a_inner = "nib_tube2_a";
var tag_tube3_b_outer = "tube1_a_inner, motor1_tube2_a, motor1_tube2_b, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a, motor3_tube2_b, motor4_tube2, motor5_tube2";
var tag_tube3_b_inner = "nib_tube2_b";

var tag_motor1_tube2_a = "tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_2";
var tag_motor1_tube2_b = "tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_1";

var tag_motor2_tube2_a = "tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_2";
var tag_motor2_tube2_b = "tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_2";

var tag_motor3_tube1 = "tube1_a_outer, tube1_b_outer";
var tag_motor3_tube2_a = "tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_2";
var tag_motor3_tube2_b = "tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_1";

var tag_motor4_tube1_a = "tube1_a_outer, tube1_b_outer";
var tag_motor4_tube1_b = "tube1_a_outer, tube1_b_outer";
var tag_motor4_tube2 = "tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_1";

var tag_motor5_tube1_a = "tube1_a_outer, tube1_b_outer";
var tag_motor5_tube1_b = "tube1_a_outer, tube1_b_outer";
var tag_motor5_tube2 = "tube2_a_outer, tube2_b_outer, tube2_mid_outer, tube3_a_outer, tube3_b_outer, nib_motors_1";

/*As mentioned above, the thing that makes Nibs complicated is that the Motors are designed to be assymetrical so that it would be obviuos
which way they are going to rotate, but that means the Nibs need a WHOLE LOT of axes/guides to account for all the different lengths of 
the motors, which means the tags are also really complicated... 
The way the other parts work is this: tubes have an A end and a B end, each with one axis. Motors have two axes for each connection, so 
that they can be placed on either end of the tube in a right or left-handed orientation. The Nibs, however, can be placed in either end
of the motor, and each placement has a unique guide too*/ 

var tag_nib_tube1_a = "tube1_a_inner";
var tag_nib_tube1_b = "tube1_b_inner";
var tag_nib_tube2_a = "tube2_a_inner, tube3_a_inner";
var tag_nib_tube2_b = "tube2_b_inner, tube3_b_inner";
var tag_nib_motors_1 = "motor1_tube2_b, motor3_tube2_b, motor4_tube2, motor5_tube2"; //Non-rotating motor placements
var tag_nib_motors_2 = "motor1_tube2_a, motor2_tube2_a, motor2_tube2_b, motor3_tube2_a"; //Rotating motor placements





//------------------------------------------Load Rhino-------------------------------------------------------------------------------------------------------------------------------------

//Heroku app runs from app.py backend (in main project directory)
//let fetchPromise = fetch('static/models/Drawing_Machine.3dm');

//Locally hosted app runs directly from index.html (in "templates" directory)
let fetchPromise = fetch('../static/models/Drawing_Machine.3dm');

rhino3dm().then(async m => {
    let rhino = m;

    let res = await fetchPromise;
    let buffer = await res.arrayBuffer();
    let arr = new Uint8Array(buffer);
    let doc = rhino.File3dm.fromByteArray(arr);

    THREE.Object3D.DefaultUp = new THREE.Vector3(0,0,1)

    init(); //Create scene
    
    let objects = doc.objects(); //Creates a File3dmObjectTable object


    //Scrub through all objects in the Rhino Doc
    for (let i = 0; i < objects.count; i++) {
        if (objects.get(i).attributes().id == guid_base_sphere) {base_sphere = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_base_tube) {base_tube = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_base_axis) {base_axis = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_base_guide) {base_guide = objects.get(i).geometry();}
        
        else if (objects.get(i).attributes().id == guid_tube1_geo) {tube1_geo = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_tube1_a_axis_1) {tube1_a_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_tube1_a_guide_1) {tube1_a_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_tube1_b_axis_1) {tube1_b_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_tube1_b_guide_1) {tube1_b_guide_1 = objects.get(i).geometry();}
        
        else if (objects.get(i).attributes().id == guid_tube2_geo) {tube2_geo = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_tube2_a_axis_1) {tube2_a_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_tube2_a_guide_1) {tube2_a_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_tube2_mid_axis_1) {tube2_mid_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_tube2_mid_guide_1) {tube2_mid_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_tube2_b_axis_1) {tube2_b_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_tube2_b_guide_1) {tube2_b_guide_1 = objects.get(i).geometry();}
        
        else if (objects.get(i).attributes().id == guid_tube3_geo) {tube3_geo = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_tube3_a_axis_1) {tube3_a_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_tube3_a_guide_1) {tube3_a_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_tube3_a_guide_2) {tube3_a_guide_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_tube3_a_guide_3) {tube3_a_guide_3 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_tube3_a_guide_4) {tube3_a_guide_4 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_tube3_b_axis_1) {tube3_b_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_tube3_b_guide_1) {tube3_b_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_tube3_b_guide_2) {tube3_b_guide_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_tube3_b_guide_3) {tube3_b_guide_3 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_tube3_b_guide_4) {tube3_b_guide_4 = objects.get(i).geometry();}
        
        else if (objects.get(i).attributes().id == guid_motor1_geo) {motor1_geo = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor1_tube2a_axis_1) {motor1_tube2a_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor1_tube2a_axis_2) {motor1_tube2a_axis_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor1_tube2a_guide_1) {motor1_tube2a_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor1_tube2a_guide_2) {motor1_tube2a_guide_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor1_tube2b_axis_1) {motor1_tube2b_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor1_tube2b_axis_2) {motor1_tube2b_axis_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor1_tube2b_guide_1) {motor1_tube2b_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor1_tube2b_guide_2) {motor1_tube2b_guide_2 = objects.get(i).geometry();}
        
        else if (objects.get(i).attributes().id == guid_motor2_geo) {motor2_geo = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor2_tube2a_axis_1) {motor2_tube2a_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor2_tube2a_axis_2) {motor2_tube2a_axis_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor2_tube2a_guide_1) {motor2_tube2a_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor2_tube2a_guide_2) {motor2_tube2a_guide_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor2_tube2b_axis_1) {motor2_tube2b_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor2_tube2b_axis_2) {motor2_tube2b_axis_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor2_tube2b_guide_1) {motor2_tube2b_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor2_tube2b_guide_2) {motor2_tube2b_guide_2 = objects.get(i).geometry();}
        
        else if (objects.get(i).attributes().id == guid_motor3_geo) {motor3_geo = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor3_tube2a_axis_1) {motor3_tube2a_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor3_tube2a_axis_2) {motor3_tube2a_axis_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor3_tube2a_guide_1) {motor3_tube2a_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor3_tube2a_guide_2) {motor3_tube2a_guide_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor3_tube2b_axis_1) {motor3_tube2b_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor3_tube2b_axis_2) {motor3_tube2b_axis_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor3_tube2b_guide_1) {motor3_tube2b_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor3_tube2b_guide_2) {motor3_tube2b_guide_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor3_tube1_axis_1) {motor3_tube1_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor3_tube1_axis_2) {motor3_tube1_axis_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor3_tube1_guide_1) {motor3_tube1_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor3_tube1_guide_2) {motor3_tube1_guide_2 = objects.get(i).geometry();}
        
        else if (objects.get(i).attributes().id == guid_motor4_geo) {motor4_geo = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor4_tube1a_axis_1) {motor4_tube1a_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor4_tube1a_axis_2) {motor4_tube1a_axis_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor4_tube1a_guide_1) {motor4_tube1a_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor4_tube1a_guide_2) {motor4_tube1a_guide_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor4_tube1b_axis_1) {motor4_tube1b_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor4_tube1b_axis_2) {motor4_tube1b_axis_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor4_tube1b_guide_1) {motor4_tube1b_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor4_tube1b_guide_2) {motor4_tube1b_guide_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor4_tube2_axis_1) {motor4_tube2_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor4_tube2_axis_2) {motor4_tube2_axis_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor4_tube2_guide_1) {motor4_tube2_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor4_tube2_guide_2) {motor4_tube2_guide_2 = objects.get(i).geometry();}
        
        else if (objects.get(i).attributes().id == guid_motor5_geo) {motor5_geo = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor5_tube1a_axis_1) {motor5_tube1a_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor5_tube1a_axis_2) {motor5_tube1a_axis_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor5_tube1a_guide_1) {motor5_tube1a_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor5_tube1a_guide_2) {motor5_tube1a_guide_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor5_tube1b_axis_1) {motor5_tube1b_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor5_tube1b_axis_2) {motor5_tube1b_axis_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor5_tube1b_guide_1) {motor5_tube1b_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor5_tube1b_guide_2) {motor5_tube1b_guide_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor5_tube2_axis_1) {motor5_tube2_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor5_tube2_axis_2) {motor5_tube2_axis_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor5_tube2_guide_1) {motor5_tube2_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_motor5_tube2_guide_2) {motor5_tube2_guide_2 = objects.get(i).geometry();}
        
        else if (objects.get(i).attributes().id == guid_nib_geo) {nib_geo = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_nib_pt) {nib_pt = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_nib_tube2_axis_1) {nib_tube2_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_nib_tube2_axis_2) {nib_tube2_axis_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_nib_tube2_guide_1) {nib_tube2_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_nib_tube1_axis_1) {nib_tube1_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_nib_tube1_axis_2) {nib_tube1_axis_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_nib_tube1_guide_1) {nib_tube1_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_nib_motors1_axis_1) {nib_motors1_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_nib_motors1_axis_2) {nib_motors1_axis_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_nib_motors2_axis_1) {nib_motors2_axis_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_nib_motors2_axis_2) {nib_motors2_axis_2 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_nib_motors1_guide_1) {nib_motors1_guide_1 = objects.get(i).geometry();}
        else if (objects.get(i).attributes().id == guid_nib_motors2_guide_1) {nib_motors2_guide_1 = objects.get(i).geometry();}
        
        else {}

    }



    

    //------------------------------------------Build Machine-------------------------------------------------------------------------------------------------------------------------------------

    base();
    draw();

});