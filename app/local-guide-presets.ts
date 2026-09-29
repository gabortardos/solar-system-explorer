import { getBody } from "./data/catalog";
import { guide } from "./data/guide-education";

const HABITABILITY = "Could humans live here?";
const TEMPERATURE = "How hot or cold is it?";
const MISSIONS = "What missions explored it?";
const WATER = "Does it have water or ice?";
const DAY_AND_YEAR = "How long are its day and year?";
const ROTATION = "How fast does it rotate?";
const ORBIT = "How long is its orbit?";
const DISTANCE = "How far is it from Earth?";
const SIMULATION_TIME = "What is the simulated date and time?";

export function localGuidePresetsFor(id: string): string[] {
  const body = getBody(id);
  if (!body) return [SIMULATION_TIME];

  const reviewedTopics = guide[id];
  const education = body.education;
  const reviewedText = education
    ? `${education.description} ${education.fact} ${education.atmosphere}`
    : "";
  const hasRotation = body.physical.rotationHours.value !== null;
  const hasOrbit = body.orbit.periodDays.value !== null;
  const presets = [HABITABILITY];

  if (reviewedTopics) presets.push(TEMPERATURE, MISSIONS);
  if (reviewedTopics || /\b(?:water|ice|icy|ocean|glacier|frost)\b/i.test(reviewedText))
    presets.push(WATER);
  if (hasRotation && hasOrbit) presets.push(DAY_AND_YEAR);
  else if (hasRotation) presets.push(ROTATION);
  else if (hasOrbit) presets.push(ORBIT);
  if (body.id !== "earth") presets.push(DISTANCE);
  presets.push(SIMULATION_TIME);

  return presets;
}
