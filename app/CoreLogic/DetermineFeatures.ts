import { HandLandmarkerResult, Landmark } from "@mediapipe/tasks-vision";
import { angleBetween, cross, distance, normalize, vector } from "./Helpers";

export interface Features {
  handedness: 'Left' | 'Right';
  landmarks: Array<{ x: number; y: number; z: number }>;
  jointAngles: Record<string, number>; // in degrees
  relativeDistances: Record<string, number>; // normalized units
  handOrientation: { palmNormalVector: { x: number; y: number; z: number } };
}

export default function determineFeatures(input: HandLandmarkerResult): Features {
  const landmarks = input.landmarks[0]; // first hand
  const handedness = input.handedness[0][0].categoryName as 'Left' | 'Right';


  // --- Joint angles ---
  const jointAngles: Record<string, number> = {};

  const fingers = {
    thumb: [1, 2, 3, 4],
    index: [5, 6, 7, 8],
    middle: [9, 10, 11, 12],
    ring: [13, 14, 15, 16],
    pinky: [17, 18, 19, 20],
  };

  for (const fingerName in fingers) {
    const indices = fingers[fingerName as keyof typeof fingers];
    // angle between base→middle and middle→tip
    const v1 = vector(landmarks[indices[0]], landmarks[indices[1]]);
    const v2 = vector(landmarks[indices[1]], landmarks[indices[2]]);
    const v3 = vector(landmarks[indices[2]], landmarks[indices[3]]);
    jointAngles[`${fingerName}_base`] = angleBetween(v1, v2);
    jointAngles[`${fingerName}_tip`] = angleBetween(v2, v3);
  }

  // --- Relative distances ---
  const relativeDistances: Record<string, number> = {};
  relativeDistances['thumb_index'] = distance(landmarks[4], landmarks[8]);
  relativeDistances['index_middle'] = distance(landmarks[8], landmarks[12]);
  relativeDistances['middle_ring'] = distance(landmarks[12], landmarks[16]);
  relativeDistances['ring_pinky'] = distance(landmarks[16], landmarks[20]);
  relativeDistances['wrist_middle'] = distance(landmarks[0], landmarks[12]);

  // --- Hand orientation (palm normal) ---
  const v1 = vector(landmarks[0], landmarks[5]);  // wrist -> index MCP
  const v2 = vector(landmarks[0], landmarks[17]); // wrist -> pinky MCP
  const palmNormal = normalize(cross(v1, v2));

  const handOrientation = { palmNormalVector: palmNormal };

  return {
    handedness,
    landmarks,
    jointAngles,
    relativeDistances,
    handOrientation,
  };
}

export function isLetterA(features: Features): boolean 
{
    if (features.landmarks.length === 21)
    {
        let result : boolean[] = [] // for each finger, if it is curled (tip below knuckle)

        // Check if fingers are curled: fingertip should be below (greater Y) than the knuckle (MCP)
        for (let fingerTipIndex of [8, 12, 16, 20]) // all but thumb
        {
            // tip.y > mcp.y means finger is curled down
            if (features.landmarks[fingerTipIndex].y > features.landmarks[fingerTipIndex-3].y)
            {
                result.push(true);
            }
        }
        
        // now check thumb, but before check if all results are true!
        if (result.length === 4 && result.every((val) => val === true))
        {
            // thumb: tip.x < ip.x < mcp.x (for right hand) 
            if (features.handedness === 'Right' &&
                features.landmarks[4].x < features.landmarks[3].x  &&
                features.landmarks[3].x < features.landmarks[2].x)
            {
                return true;
            } else if (features.handedness === 'Left' &&
                features.landmarks[4].x > features.landmarks[3].x  &&
                features.landmarks[3].x > features.landmarks[2].x)
            {
                return true;
            } 
        }
        return false;
    }
    return false;
}

export function isLetterB(features: Features): boolean
{
    if (features.landmarks.length === 21)
    {
        let result : boolean[] = [] // for each finger, if it is curled (tip below knuckle)
        // [1 is mcp .. 2 is pip.. 3 is dip .. 4 is tip]
        // Check if fingers are curled: fingertip should be below (greater Y) than the knuckle (MCP)
        for (let fingerTipIndex of [8, 12, 16, 20]) // all but thumb
        {
            // tip.y > mcp.y means finger is curled down
            if (features.landmarks[fingerTipIndex].y < features.landmarks[fingerTipIndex-1].y &&
                features.landmarks[fingerTipIndex].y < features.landmarks[fingerTipIndex-2].y &&
                features.landmarks[fingerTipIndex].y < features.landmarks[fingerTipIndex-3].y
            )
            {
                result.push(true);
            }
        }
        
        // now check thumb, but before check if all results are true!
        if (result.length === 4 && result.every((val) => val === true))
        {
            // thumb: tip.x < dip.x < mcp.x (for right hand) 
            if (features.handedness === 'Right' &&
                features.landmarks[4].x < features.landmarks[1].x) // means that tip is left of dip
            {
                return true;
            } else if (features.handedness === 'Left' &&
                features.landmarks[4].x > features.landmarks[1].x)
            {
                return true;
            } 
        }
        return false;
    }
    return false;
}

export function letterDetected(features: Features): string
{
    if (isLetterA(features))
        return "A";
    if (isLetterB(features))
        return "B";
    return "";
}