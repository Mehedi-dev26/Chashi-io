import { CheckCircle2, Info, AlertCircle, AlertTriangle } from "lucide-react";
import type { ActivityEntry } from "@/hooks/useIrrigationData";

const bn = (s: string) => s.replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);

const iconMap = {
  success: { Icon: CheckCircle2, color: "text-success" },
  info: { Icon: Info, color: "text-chart-2" },
  warning: { Icon: AlertTriangle, color: "text-accent" },
  alert: { Icon: AlertCircle, color: "text-destructive" },
};

// Translate common English log fragments to Bangla
function translate(msg: string): string {
  return msg
    .replace(/Zone\s+/gi, "জোন ")
    .replace(/valve opened — irrigation started/gi, "ভাল্ভ খোলা হয়েছে — সেচ শুরু")
    .replace(/AI: Optimal watering window detected/gi, "AI: সেচের উপযুক্ত সময় শনাক্ত")
    .replace(/soil moisture below 25% threshold/gi, "মাটির আর্দ্রতা ২৫% এর নিচে")
    .replace(/Main pump started — pressure stable at/gi, "প্রধান পাম্প চালু — চাপ স্থিতিশীল")
    .replace(/Main pump stopped from control panel/gi, "নিয়ন্ত্রণ প্যানেল থেকে পাম্প বন্ধ করা হয়েছে")
    .replace(/Main pump started from control panel/gi, "নিয়ন্ত্রণ প্যানেল থেকে পাম্প চালু করা হয়েছে")
    .replace(/Weather sync: no rainfall expected next 48h/gi, "আবহাওয়া: পরবর্তী ৪৮ ঘণ্টায় বৃষ্টির সম্ভাবনা নেই")
    .replace(/valve opened via dashboard/gi, "ভাল্ভ ড্যাশবোর্ড থেকে খোলা হয়েছে")
    .replace(/valve closed via dashboard/gi, "ভাল্ভ ড্যাশবোর্ড থেকে বন্ধ করা হয়েছে");
}

export function ActivityFeed({ activity }: { activity: ActivityEntry[] }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-bold">কার্যকলাপ লগ</h2>
        <span className="text-[10px] text-success bg-success/10 px-2 py-1 rounded-full">● লাইভ</span>
      </div>
      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
        {activity.map((a) => {
          const { Icon, color } = iconMap[a.type];
          return (
            <div key={a.id} className="flex gap-2.5 text-sm rounded-lg p-2 hover:bg-secondary/50 transition">
              <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${color}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-snug">{translate(a.message)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{bn(a.time)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
