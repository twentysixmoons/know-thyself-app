import { saveEntry } from "./entries";
import { saveJournal } from "./journal";

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

export function seedSampleData() {
  const bodySamples = [
    { date: daysAgo(1), region: "kneeL" as const, intensity: 3, kind: "body" as const, notes: "Slipped on the garden steps. Bruise forming, stiff when bending.", factors: ["fall"] },
    { date: daysAgo(2), region: "head" as const, intensity: 2, kind: "body" as const, notes: "Dull headache behind the eyes, probably dehydration.", factors: ["lowWater"] },
    { date: daysAgo(4), region: "pelvis" as const, intensity: 4, kind: "body" as const, notes: "Cramping, heavy and low. Heat pad helped a little.", factors: ["period"] },
    { date: daysAgo(6), region: "lowerBack" as const, intensity: 3, kind: "body" as const, notes: "Lower back tight after sitting too long.", factors: ["stress"] },
    { date: daysAgo(8), region: "shoulderL" as const, intensity: 2, kind: "body" as const, notes: "Carrying tension in my left shoulder.", factors: ["stress"] },
    { date: daysAgo(11), region: "head" as const, intensity: 3, kind: "body" as const, notes: "Tension headache, jaw clenched during the day.", factors: ["stress", "lowWater"] },
    { date: daysAgo(14), region: "stomach" as const, intensity: 2, kind: "body" as const, notes: "Mild nausea after a heavy meal.", factors: ["alcohol"] },
    { date: daysAgo(17), region: "kneeL" as const, intensity: 2, kind: "body" as const, notes: "Same knee aching after a long walk.", factors: ["exercise"] },
    { date: daysAgo(21), region: "footR" as const, intensity: 3, kind: "body" as const, notes: "Right foot sore from new shoes.", factors: ["exercise"] },
    { date: daysAgo(25), region: "hipL" as const, intensity: 2, kind: "body" as const, notes: "Left hip felt unstable during yoga.", factors: ["exercise"] },
  ];

  const mindSamples = [
    { date: daysAgo(1), title: "Quiet morning", text: "Woke up slowly and made tea. The day felt gentle.", gratitude: ["Tea in bed", "Cool air through the window", "A text from a friend"], moods: ["calm", "grateful"] as const },
    { date: daysAgo(2), title: "Overwhelm", text: "Too many deadlines stacked up. I took a walk at lunch.", gratitude: ["The walk", "Lunch outside", "A good playlist"], moods: ["anxious", "numb"] as const },
    { date: daysAgo(3), title: "Small wins", text: "Finished a task I’d been avoiding. Felt lighter.", gratitude: ["Crossing it off", "A clear desk", "Sunset colors"], moods: ["happy", "confident"] as const },
    { date: daysAgo(5), title: "Sad news", text: "Heard about a friend moving away. Gave myself space.", gratitude: ["Tears", "A soft blanket", "Music that gets it"], moods: ["sad", "calm"] as const },
    { date: daysAgo(7), title: "Angry afternoon", text: "A conversation went sideways. I journaled it out.", gratitude: ["The page", "Time alone", "Deep breaths"], moods: ["angry", "anxious"] as const },
    { date: daysAgo(9), title: "Grateful evening", text: "Dinner was simple and good. Feeling held by routine.", gratitude: ["Warm food", "Clean sheets", "A slow evening"], moods: ["grateful", "calm"] as const },
    { date: daysAgo(12), title: "Numb day", text: "Nothing felt sharp today. Just floated through tasks.", gratitude: ["Coffee", "A shower", "Bed early"], moods: ["numb"] as const },
    { date: daysAgo(15), title: "Confidence", text: "Spoke up in a meeting. Voice shook but I did it.", gratitude: ["Courage", "Kind colleagues", "A clear sky"], moods: ["confident", "happy"] as const },
    { date: daysAgo(18), title: "Missing someone", text: "Felt the absence today. Let it sit without fixing it.", gratitude: ["Memories", "A letter I found", "Tea"], moods: ["sad", "grateful"] as const },
    { date: daysAgo(22), title: "Hopeful", text: "New idea sparked while washing dishes. Wrote it down.", gratitude: ["Inspiration", "Quiet house", "Notebook by the sink"], moods: ["happy", "calm"] as const },
  ];

  for (const e of bodySamples) {
    saveEntry({ date: e.date, region: e.region, intensity: e.intensity, kind: e.kind, notes: e.notes, factors: e.factors as any });
  }
  for (const j of mindSamples) {
    saveJournal({ date: j.date, title: j.title, text: j.text, gratitude: j.gratitude, moods: j.moods as any });
  }
}
