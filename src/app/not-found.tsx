import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { Brand } from "@/components/site-shell";

export default function NotFound() {
  return <main className="not-found"><header><Brand light /><Link href="/" className="not-found-home">Back to home <ArrowUpRight size={15} /></Link></header><div className="not-found-center"><span className="not-found-spark"><Sparkles size={26} /></span><p className="section-kicker">Looks like we missed a turn</p><h1>4<span>0</span>4</h1><h2>This space is off the map.</h2><p>The page you’re looking for has moved or doesn’t exist.</p><Link href="/" className="button button-lime">Let’s get you home <ArrowUpRight size={16} /></Link></div><div className="not-found-foot">A little space goes a long way. © StudioSpace</div></main>;
}
