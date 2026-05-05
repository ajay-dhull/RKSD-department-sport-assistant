import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Bot,
  Building2,
  Hospital,
  Scale,
  MapPin,
  Navigation,
  Sparkles,
  Zap,
  Shield,
  Globe,
  Users,
  Clock,
  CheckCircle2,
  ArrowRight,
  Mail,
  Send,
  MessageSquare,
  Lightbulb,
  Rocket,
  Star,
  Mic,
  Map,
  Brain,
  ChevronDown,
  Activity,
  Eye,
  Cpu,
  Database,
  Lock,
  Image as ImageIcon,
  Layers,
  Smartphone,
  Play,
  Pause,
  Phone,
} from "lucide-react";
import {
  Instagram,
  Linkedin,
  Twitter,
  Send as TelegramIcon,
} from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import Ballpit from "@/components/Ballpit";
import SplitText from "@/components/SplitText";
import CardSwap, { Card } from "@/components/CardSwap";
import CircleGallery from "@/components/CircleGallery";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState("");
  const [demoModal, setDemoModal] = useState<"campus" | "court" | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleEarlyAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast({
      title: "Welcome to the future! 🚀",
      description: "You're on the early access list. We'll be in touch soon.",
    });
    setEmail("");
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 },
  };

  return (
    <div
      className="min-h-screen text-white overflow-x-hidden"
      style={{
        background:
          "linear-gradient(180deg, #0E0E15 0%, #1a0f0f 50%, #0E0E15 100%)",
      }}
    >
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-yellow-500/3 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        ></div>
      </div>
      {/* Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-[#0E0E15]/90 backdrop-blur-xl border-b border-orange-500/10 shadow-lg shadow-orange-500/5" : "bg-transparent"}`}
      >
        <div className="container mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="relative group cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur-md opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div>
                <div className="relative bg-gradient-to-br from-orange-500 to-amber-500 p-2.5 rounded-xl">
                  <Navigation className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
                    WayFinder.Ai
                  </span>
                </h1>
                <p className="text-xs text-gray-400">
                  AI Navigation Intelligence
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-24 pb-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/images/hero3.png"
            alt="Hero Background"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        </div>

        {/* Ballpit Background - Currently Hidden */}
        {/* <div className="absolute inset-0 opacity-60">
          <Ballpit />
        </div> */}

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center space-y-8 py-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 border border-orange-300/30 bg-orange-500/20 backdrop-blur-md shadow-lg">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-yellow-100 font-semibold text-sm tracking-wide">
                  Next-Gen AI Navigation
                </span>
              </div>
              {/* FIXED HEADING SPACING */}
              <div className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-6 leading-[1.2] sm:leading-[1.2] lg:leading-[1.2] drop-shadow-2xl">
                <SplitText
                  text="Navigate institutions like"
                  className="block text-white drop-shadow-lg"
                  tag="span"
                  delay={50}
                  duration={0.8}
                  from={{ opacity: 0, y: 50 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0.1}
                />
                <span className="block bg-gradient-to-r from-yellow-200 via-orange-300 to-yellow-100 bg-clip-text text-transparent drop-shadow-2xl">
                  the world finally learned to speak.
                </span>
              </div>

              <p className="text-base sm:text-xl text-white max-w-3xl mx-auto leading-relaxed font-medium drop-shadow-lg px-4">
                AI that guides every student, patient, visitor, and citizen with
                clarity, direction, and confidence.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-5 justify-center items-center pt-6"
            >
              <Button
                size="lg"
                className="relative overflow-hidden group px-10 py-4 h-14 min-w-[240px] shadow-2xl"
                onClick={() =>
                  document
                    .getElementById("demo")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-400 transition-transform group-hover:scale-110"></div>
                <span className="relative flex items-center gap-2 text-black font-bold text-base">
                  <Zap className="h-5 w-5" />
                  Experience Live Demo
                </span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white/60 bg-white/10 backdrop-blur-md text-white hover:bg-white/25 hover:border-white/80 px-10 py-4 h-14 min-w-[240px] group font-bold text-base shadow-2xl"
                onClick={() =>
                  document
                    .getElementById("how-it-works")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <span className="flex items-center gap-2">
                  How It Works
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Button>
            </motion.div>

            <motion.div
              style={{ opacity }}
              className="mt-16 flex justify-center pb-4"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-white drop-shadow-lg"
              >
                <ChevronDown className="h-10 w-10" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How WayFinder.Ai Works Section */}
      <section id="overview" className="py-10 sm:py-14 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/5 to-transparent"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          {/* Section Title */}
          <motion.div {...fadeInUp} className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              How{" "}
              <motion.span
                className="inline-block bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{ backgroundSize: "200% 200%" }}
              >
                WayFinder.Ai
              </motion.span>{" "}
              Works
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-start">
            {" "}
            {/* Left: Video */}{" "}
            <motion.div
              {...fadeInUp}
              className="flex justify-center lg:justify-start order-1 lg:order-1 ml-0 lg:ml-[-4rem] mt-2 sm:mt-3 lg:mt-4"
            >
              {" "}
              <div className="relative w-full max-w-[98%] sm:max-w-xl md:max-w-2xl lg:max-w-[72vw]">
                {" "}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl blur-lg opacity-20"></div>{" "}
                <div className="relative rounded-xl overflow-hidden shadow-xl border border-orange-500/20 bg-black/40 backdrop-blur-sm">
                  {" "}
                  <video
                    src="/images/video1.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto min-h-[200px] sm:min-h-[250px] md:min-h-[340px] lg:min-h-[420px] object-cover"
                  />{" "}
                </div>{" "}
              </div>{" "}
            </motion.div>
            {/* Right: Text Content */}
            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.2 }}
              className="space-y-3 sm:space-y-4 order-2 lg:order-2"
            >
              <div className="group">
                <p
                  className="text-sm sm:text-base lg:text-lg text-gray-100 leading-relaxed font-medium"
                  style={{ lineHeight: "1.7" }}
                >
                  <span className="inline-block bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent font-bold text-lg sm:text-xl">
                    WayFinder.Ai
                  </span>{" "}
                  is an AI-powered institutional assistant built to simplify and
                  modernize experiences inside large facilities — from
                  universities and hospitals to courts and corporate campuses.
                </p>
              </div>

              <div className="group">
                <p
                  className="text-sm sm:text-base lg:text-lg text-gray-100 leading-relaxed font-medium"
                  style={{ lineHeight: "1.7" }}
                >
                  It provides students, visitors, and staff with real-time
                  guidance, instant information, and step-by-step navigation —
                  through voice, chat, and interactive maps. Whether it's
                  finding a classroom, locating a department, or reaching the
                  right office, WayFinder.Ai eliminates confusion and saves time with
                  intelligent, human-like assistance.
                </p>
              </div>

              <div className="group">
                <p
                  className="text-sm sm:text-base lg:text-lg text-gray-100 leading-relaxed font-medium"
                  style={{ lineHeight: "1.7" }}
                >
                  For institutions, WayFinder.Ai offers a powerful AI-driven control
                  dashboard that unifies all internal operations. It helps
                  administrators manage departments, monitor visitor flow,
                  automate daily tasks, and improve overall coordination — all
                  from a single smart interface.
                </p>
              </div>

              <div className="relative overflow-hidden rounded-xl p-4 sm:p-6 border border-orange-500/30 bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-transparent backdrop-blur-sm shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-amber-500/10"></div>
                <p
                  className="relative text-base sm:text-lg text-center text-gray-50 font-semibold tracking-wide"
                  style={{ lineHeight: "1.6" }}
                >
                  Smarter systems. Clearer communication. Seamless operations.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      {/* Smart Features of WayFinder.Ai Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 relative bg-gradient-to-b from-transparent via-blue-500/5 to-transparent">
        <div className="container mx-auto max-w-6xl">
          {/* Section Title */}
          <motion.div {...fadeInUp} className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
              Smart Features of{" "}
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                WayFinder.Ai
              </span>
            </h2>
          </motion.div>

          {/* Section Overview Text */}
          <motion.div {...fadeInUp} className="text-center mb-8 sm:mb-10 px-4">
            <p
              className="text-sm sm:text-base lg:text-lg text-gray-100 leading-relaxed font-medium max-w-4xl mx-auto"
              style={{ lineHeight: "1.7" }}
            >
              WayFinder.Ai's AI Assistant brings life to every large institution —
              guiding users in real-time through natural voice or chat. It's
              more than a chatbot — it's your digital guide who knows every
              corner, every room, and every process.
            </p>
          </motion.div>

          {/* AI Assistant Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start mb-16 sm:mb-20">
            {/* Left: Text Content */}
            <motion.div
              {...fadeInUp}
              className="space-y-4 sm:space-y-6 order-2 lg:order-1"
            >
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3">
                AI Assistant That Understands, Guides & Simplifies
              </h3>

              {/* Key Features */}
              <div className="space-y-3 mt-6">
                {[
                  {
                    icon: Mic,
                    title: "Voice-First Experience",
                    desc: "Talk naturally and get instant, human-like guidance.",
                  },
                  {
                    icon: Map,
                    title: "Smart Navigation",
                    desc: "Provides step-by-step routes with live maps, room numbers, and directions.",
                  },
                  {
                    icon: Navigation,
                    title: "Context-Aware Help",
                    desc: "Detects your location and tells you where to go, whom to meet, and what to do next.",
                  },
                  {
                    icon: Users,
                    title: "Student & Visitor Mode",
                    desc: "Access class schedules, teacher info, and process details effortlessly.",
                  },
                  {
                    icon: Building2,
                    title: "Custom for Every Institution",
                    desc: "Each organization gets its own AI assistant mapped to its unique structure.",
                  },
                ].map((feature, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-white/5 border border-orange-500/20 hover:border-orange-500/40 transition-all"
                  >
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                      <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1 text-sm sm:text-base">
                        {feature.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-300">
                        {feature.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <p className="text-sm sm:text-base lg:text-lg text-orange-300 font-semibold italic mt-4">
                From classrooms to courtrooms — WayFinder.Ai brings clarity
                everywhere.
              </p>
            </motion.div>

            {/* Right: Card Animation - Desktop uses CardSwap, Mobile uses horizontal scroll */}

            {/* Desktop CardSwap Animation (hidden on mobile) */}
            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.2 }}
              className="hidden lg:flex relative h-[500px] w-full order-1 lg:order-2 items-center justify-center"
            >
              <div className="w-full max-w-[350px] mx-auto">
                <CardSwap
                  width={350}
                  height={450}
                  cardDistance={25}
                  verticalDistance={35}
                  delay={3000}
                  pauseOnHover={true}
                  skewAmount={3}
                  easing="elastic"
                >
                  <Card customClass="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-blue-500/30 shadow-2xl shadow-blue-500/20 overflow-hidden">
                    <div className="w-full h-full flex flex-col">
                      <img
                        src="/images/assistant1.png"
                        alt="College Voice Assistant"
                        className="w-full h-[calc(100%-60px)] object-cover"
                      />
                      <div className="h-[60px] bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center px-4">
                        <h4 className="text-white font-bold text-center text-sm sm:text-base">
                          College Voice Assistant
                        </h4>
                      </div>
                    </div>
                  </Card>
                  <Card customClass="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-amber-500/30 shadow-2xl shadow-amber-500/20 overflow-hidden">
                    <div className="w-full h-full flex flex-col">
                      <img
                        src="/images/assistant2.png"
                        alt="Court Legal Assistant"
                        className="w-full h-[calc(100%-60px)] object-cover"
                      />
                      <div className="h-[60px] bg-gradient-to-r from-amber-600 to-yellow-600 flex items-center justify-center px-4">
                        <h4 className="text-white font-bold text-center text-sm sm:text-base">
                          Court Legal Navigator
                        </h4>
                      </div>
                    </div>
                  </Card>
                  <Card customClass="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-purple-500/30 shadow-2xl shadow-purple-500/20 overflow-hidden">
                    <div className="w-full h-full flex flex-col">
                      <img
                        src="/images/assistant3.png"
                        alt="Corporate Institution Assistant"
                        className="w-full h-[calc(100%-60px)] object-cover"
                      />
                      <div className="h-[60px] bg-gradient-to-r from-purple-600 to-purple-700 flex items-center justify-center px-4">
                        <h4 className="text-white font-bold text-center text-sm sm:text-base">
                          Enterprise Assistant
                        </h4>
                      </div>
                    </div>
                  </Card>
                </CardSwap>
              </div>
            </motion.div>

            {/* Mobile Horizontal Scroll (shown only on mobile) */}
            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.2 }}
              className="lg:hidden relative w-full order-1 lg:order-2 overflow-hidden py-8"
            >
              <motion.div
                className="flex gap-6 px-4"
                animate={{
                  x: ["0%", "-66.66%"],
                }}
                transition={{
                  duration: 15,
                  repeat: Infinity,
                  ease: "linear",
                  repeatType: "loop",
                }}
              >
                {[
                  {
                    image: "/images/assistant1.png",
                    title: "College Voice Assistant",
                    gradient: "from-blue-600 to-blue-700",
                    border: "border-blue-500/30",
                    shadow: "shadow-blue-500/20",
                  },
                  {
                    image: "/images/assistant2.png",
                    title: "Court Legal Navigator",
                    gradient: "from-amber-600 to-yellow-600",
                    border: "border-amber-500/30",
                    shadow: "shadow-amber-500/20",
                  },
                  {
                    image: "/images/assistant3.png",
                    title: "Enterprise Assistant",
                    gradient: "from-purple-600 to-purple-700",
                    border: "border-purple-500/30",
                    shadow: "shadow-purple-500/20",
                  },
                  {
                    image: "/images/assistant1.png",
                    title: "College Voice Assistant",
                    gradient: "from-blue-600 to-blue-700",
                    border: "border-blue-500/30",
                    shadow: "shadow-blue-500/20",
                  },
                  {
                    image: "/images/assistant2.png",
                    title: "Court Legal Navigator",
                    gradient: "from-amber-600 to-yellow-600",
                    border: "border-amber-500/30",
                    shadow: "shadow-amber-500/20",
                  },
                  {
                    image: "/images/assistant3.png",
                    title: "Enterprise Assistant",
                    gradient: "from-purple-600 to-purple-700",
                    border: "border-purple-500/30",
                    shadow: "shadow-purple-500/20",
                  },
                ].map((card, idx) => (
                  <div
                    key={idx}
                    className={`flex-shrink-0 w-[280px] sm:w-[320px] bg-gradient-to-br from-gray-900 to-gray-800 border-2 ${card.border} ${card.shadow} shadow-2xl rounded-2xl overflow-hidden`}
                  >
                    <div className="w-full flex flex-col h-[380px] sm:h-[420px]">
                      <img
                        src={card.image}
                        alt={card.title}
                        className="w-full h-[calc(100%-60px)] object-cover"
                      />
                      <div
                        className={`h-[60px] bg-gradient-to-r ${card.gradient} flex items-center justify-center px-4`}
                      >
                        <h4 className="text-white font-bold text-center text-sm sm:text-base">
                          {card.title}
                        </h4>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          </div>

          {/* Dashboard Section */}
          <motion.div {...fadeInUp} className="text-center mb-6 sm:mb-8">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 text-white px-4">
              For Institutions — An Intelligent Control System That Works
              Smarter
            </h3>
          </motion.div>

          <motion.div
            {...fadeInUp}
            className="max-w-3xl mx-auto mb-8 sm:mb-12 p-4 sm:p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 backdrop-blur-sm"
          >
            <p
              className="text-sm sm:text-base lg:text-lg text-gray-100 leading-relaxed font-medium text-center"
              style={{ lineHeight: "1.7" }}
            >
              WayFinder.Ai empowers institutions with a centralized, AI-powered
              control dashboard. Admins can manage data, monitor real-time
              activity, and automate repetitive work — all from one intuitive
              interface. Instant updates reflect across the assistant system,
              ensuring smooth operations and faster communication.
            </p>
            <p className="text-base sm:text-lg lg:text-xl font-bold text-center mt-4 bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              From manual management to AI automation — WayFinder.Ai makes every
              process 10× faster.
            </p>
          </motion.div>

          {/* Circle Gallery - Now showing on all devices */}
          <motion.div
            {...fadeInUp}
            className="w-full h-[280px] sm:h-[400px] md:h-[450px] lg:h-[500px] relative"
          >
            <CircleGallery
              items={[
                { image: "/images/dashboard1.png", text: "Court Admin Panel" },
                { image: "/images/dashboard2.png", text: "College Dashboard" },
                {
                  image: "/images/dashboard3.png",
                  text: "Institution Control",
                },
              ]}
              bend={3}
              textColor="#f97316"
              borderRadius={0.05}
              scrollSpeed={2}
              scrollEase={0.05}
              autoRotate={true}
              autoRotateSpeed={0.02}
            />
          </motion.div>
        </div>
      </section>
      {/* Experience Intelligent Navigation Section */}
      <section id="demo" className="py-20 sm:py-24 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent"></div>
        <div className="container mx-auto max-w-7xl relative z-10">
          {/* Section Header */}
          <motion.div {...fadeInUp} className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
              Experience{" "}
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                Intelligent Navigation
              </span>{" "}
              &{" "}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Real-Time Assistance
              </span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-300 max-w-4xl mx-auto leading-relaxed px-4">
              Explore how WayFinder.Ai guides, informs, and connects people inside
              real environments.
            </p>
            <div className="mt-6 px-4">
              <p className="text-sm sm:text-base lg:text-lg text-gray-100 font-medium max-w-3xl mx-auto leading-relaxed">
                WayFinder.Ai doesn't just guide you to places.
                <br className="hidden sm:block" />
                <span className="text-orange-400 font-semibold">
                  It answers, informs, assists, and connects you with the right
                  people, the right time, the right place.
                </span>
              </p>
            </div>
          </motion.div>

          {/* Demo Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Campus Intelligence Demo */}
            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.1 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500 opacity-0 group-hover:opacity-15 rounded-3xl blur-xl transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-orange-500/20 rounded-3xl p-6 sm:p-8 h-full hover:border-orange-500/40 transition-all shadow-xl hover:shadow-2xl flex flex-col">
                {/* Icon & Badge */}
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-4 rounded-2xl shadow-lg">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold mb-3 text-white">
                  Campus Intelligence Demo
                </h3>

                {/* Description */}
                <p className="text-gray-300 text-sm sm:text-base mb-6 leading-relaxed">
                  AI that guides, informs, and supports students in real time
                </p>

                {/* Features List */}
                <ul className="space-y-3 mb-8 flex-grow">
                  {[
                    "Turn by turn campus navigation",
                    "Live class schedules & faculty details",
                    "Lab, library, admin & event info",
                    'Ask anything: "Which room?", "Who is the faculty?", "Where is submission desk?"',
                  ].map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm text-gray-200"
                    >
                      <CheckCircle2 className="h-5 w-5 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Buttons */}
                <div className="flex gap-3 mt-auto">
                  <Button
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-lg hover:shadow-xl transition-all text-sm py-5"
                    onClick={() => setDemoModal("campus")}
                  >
                    🎙️ AI Assistant
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-orange-500/50 text-orange-300 hover:bg-orange-500/10 hover:text-white font-bold transition-all text-sm py-5"
                    onClick={() => setLocation("/admin/login")}
                  >
                    🗂️ Admin Panel
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Court Intelligence Demo */}
            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.2 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-violet-500 opacity-0 group-hover:opacity-15 rounded-3xl blur-xl transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-purple-500/20 rounded-3xl p-6 sm:p-8 h-full hover:border-purple-500/40 transition-all shadow-xl hover:shadow-2xl flex flex-col">
                {/* Icon & Badge */}
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-gradient-to-br from-purple-500 to-violet-500 p-4 rounded-2xl shadow-lg">
                    <Scale className="h-8 w-8 text-white" />
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold mb-3 text-white">
                  Court Intelligence Demo
                </h3>

                {/* Description */}
                <p className="text-gray-300 text-sm sm:text-base mb-6 leading-relaxed">
                  Smart routing and legal information access
                </p>

                {/* Features List */}
                <ul className="space-y-3 mb-8 flex-grow">
                  {[
                    "Courtroom & office directions",
                    "Case block & judge chamber info",
                    "Visitor & lawyer support guidance",
                    'Ask: "Where is Courtroom-12?", "Which block is registry?"',
                  ].map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm text-gray-200"
                    >
                      <CheckCircle2 className="h-5 w-5 text-purple-400 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Buttons */}
                <div className="flex gap-3 mt-auto">
                  <Button
                    className="flex-1 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-bold shadow-lg hover:shadow-xl transition-all text-sm py-5"
                    onClick={() => setDemoModal("court")}
                  >
                    🎙️ AI Assistant
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-purple-500/50 text-purple-300 hover:bg-purple-500/10 hover:text-white font-bold transition-all text-sm py-5"
                    onClick={() => setLocation("/court-admin-login")}
                  >
                    🗂️ Admin Panel
                  </Button>
                </div>
              </div>
            </motion.div>

            {/* Hospital Intelligence Demo */}
            <motion.div
              {...fadeInUp}
              transition={{ delay: 0.3 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-rose-500 opacity-0 group-hover:opacity-15 rounded-3xl blur-xl transition-opacity"></div>
              <div className="relative bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm border border-pink-500/20 rounded-3xl p-6 sm:p-8 h-full hover:border-pink-500/40 transition-all shadow-xl hover:shadow-2xl flex flex-col">
                {/* Icon & Badge */}
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-4 rounded-2xl shadow-lg">
                    <Hospital className="h-8 w-8 text-white" />
                  </div>
                  <span className="px-4 py-2 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                    Coming Soon
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold mb-3 text-white">
                  Hospital Intelligence Demo
                </h3>

                {/* Description */}
                <p className="text-gray-300 text-sm sm:text-base mb-6 leading-relaxed">
                  Instant navigation and medical information assistance
                </p>

                {/* Features List */}
                <ul className="space-y-3 mb-8 flex-grow">
                  {[
                    "Ward & OPD directions",
                    "Doctor availability & department info",
                    "Emergency routing & support instructions",
                    'Ask: "Where is cardiology?", "Who is on duty?"',
                  ].map((feature, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm text-gray-200"
                    >
                      <CheckCircle2 className="h-5 w-5 text-pink-400 flex-shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button - Coming Soon */}
                <Button
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300 font-bold shadow-lg cursor-not-allowed text-base py-6 mt-auto"
                  disabled
                >
                  Coming Soon
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
      {/* Meet the Minds Behind WayFinder.Ai Video Section */}
      <section className="py-8 sm:py-10 px-4 sm:px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          {/* Section Header */}
          <motion.div {...fadeInUp} className="text-center mb-6 sm:mb-8">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
              <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                Meet the Minds
              </span>{" "}
              Behind WayFinder.Ai
            </h2>
          </motion.div>

          {/* Video Frame */}
          <motion.div
            {...fadeInUp}
            className="relative px-0 sm:px-2 md:px-4 lg:px-6 xl:px-8"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg blur-lg opacity-10"></div>
            <div className="relative bg-black rounded-lg overflow-hidden shadow-lg border border-orange-500/20 mx-auto w-full max-w-[98%]">
              <div className="relative" style={{ paddingTop: "48%" }}>
                {/* Video with thumbnail */}
                <video
                  id="team-video"
                  src="/images/video1.mp4"
                  poster="/images/video-thumbnail.jpg" // Thumbnail before play
                  className="absolute top-0 left-0 w-full h-full object-cover cursor-pointer"
                  onClick={() => {
                    const video = document.getElementById(
                      "team-video",
                    ) as HTMLVideoElement;
                    if (video) {
                      if (isVideoPlaying) {
                        video.pause();
                        setIsVideoPlaying(false);
                      } else {
                        video.play();
                        setIsVideoPlaying(true);
                      }
                    }
                  }}
                />
                {/* Play Button Overlay */}
                {!isVideoPlaying && (
                  <div
                    className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 hover:bg-black/30 transition-all"
                    onClick={() => {
                      const video = document.getElementById(
                        "team-video",
                      ) as HTMLVideoElement;
                      if (video) {
                        video.play();
                        setIsVideoPlaying(true);
                      }
                    }}
                  >
                    <div className="bg-orange-500 hover:bg-orange-600 rounded-full p-3 sm:p-4 shadow-lg transition-all transform hover:scale-110">
                      <Play
                        className="h-6 w-6 sm:h-8 sm:w-8 text-white"
                        fill="white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact / Join Us Section */}
      <section id="contact" className="py-24 px-6 relative">
        <div className="container mx-auto max-w-4xl">
          <motion.div {...fadeInUp} className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Join our{" "}
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                mission
              </span>
            </h2>
            <p className="text-lg text-gray-300">
              We're building a future where every institution communicates
              clearly.
            </p>
          </motion.div>

          <motion.div
            {...fadeInUp}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-3xl blur-2xl"></div>
            <div className="relative bg-gradient-to-br from-white/5 to-transparent backdrop-blur-sm border border-orange-500/20 rounded-3xl p-8 md:p-12 shadow-xl">
              <form onSubmit={handleEarlyAccess} className="space-y-6">
                <div>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/5 border-orange-500/20 text-white placeholder:text-gray-500 h-14 text-lg focus:border-orange-500/40"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white h-14 text-lg font-semibold shadow-lg"
                >
                  <Send className="mr-2 h-5 w-5" />
                  Join Early Access
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      </section>
      {/* Footer */}
      <footer className="py-12 px-6 border-t border-orange-500/10">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* WayFinder.Ai Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg blur-sm opacity-75"></div>
                  <div className="relative bg-gradient-to-br from-orange-500 to-amber-500 p-2 rounded-lg">
                    <Navigation className="h-5 w-5 text-white" />
                  </div>
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
                  WayFinder.Ai
                </h3>
              </div>
              <p className="text-gray-300 text-sm">
                AI Navigation Intelligence for the modern world
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    onClick={() =>
                      document
                        .getElementById("overview")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="text-gray-300 hover:text-orange-400 transition-colors"
                  >
                    Overview
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document
                        .getElementById("demo")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="text-gray-300 hover:text-orange-400 transition-colors"
                  >
                    Demo
                  </button>
                </li>
                <li>
                  <button
                    onClick={() =>
                      document
                        .getElementById("contact")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="text-gray-300 hover:text-orange-400 transition-colors"
                  >
                    Contact
                  </button>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <div className="space-y-3 text-sm">
                <a
                  href="tel:8168376279"
                  className="flex items-center gap-2 text-gray-300 hover:text-orange-400 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  <span>8168376279</span>
                </a>
                <a
                  href="https://wa.me/918708327670"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-300 hover:text-orange-400 transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>8708327670</span>
                </a>
                <a
                  href="mailto:ajaydhull9898@gmail.com"
                  className="flex items-center gap-2 text-gray-300 hover:text-orange-400 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span>ajaydhull9898@gmail.com</span>
                </a>
                <a
                  href="mailto:dhullajay024@gmail.com"
                  className="flex items-center gap-2 text-gray-300 hover:text-orange-400 transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  <span>dhullajay024@gmail.com</span>
                </a>
              </div>
            </div>

            {/* Social Media */}
            <div>
              <h4 className="font-semibold text-white mb-4">Social Media</h4>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-orange-500 p-2 rounded-lg transition-all"
                >
                  <Instagram className="h-5 w-5 text-gray-300 hover:text-white" />
                </a>
                <a
                  href="https://t.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-orange-500 p-2 rounded-lg transition-all"
                >
                  <TelegramIcon className="h-5 w-5 text-gray-300 hover:text-white" />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-orange-500 p-2 rounded-lg transition-all"
                >
                  <Linkedin className="h-5 w-5 text-gray-300 hover:text-white" />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-orange-500 p-2 rounded-lg transition-all"
                >
                  <Twitter className="h-5 w-5 text-gray-300 hover:text-white" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-orange-500/10 pt-8 text-center">
            <p className="text-gray-300 text-sm mb-2">
              &copy; {new Date().getFullYear()} WayFinder.Ai. All rights reserved.
            </p>
            <p className="text-orange-400 text-sm font-medium">
              Made with ambition in India. Built for the world.
            </p>
          </div>
        </div>
      </footer>

      {/* Campus Demo Modal */}
      <Dialog
        open={demoModal === "campus"}
        onOpenChange={() => setDemoModal(null)}
      >
        <DialogContent className="max-w-2xl h-[90vh] flex flex-col bg-white text-gray-900 border-2 border-orange-300 shadow-2xl p-0">
          {/* Header */}
          <div className="flex-shrink-0 p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                <span className="text-3xl">👋</span> Welcome to the WayFinder.Ai Demo
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 text-gray-700 text-base space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="font-semibold text-blue-900">
                This experience is a preview, running on demo-based data trained
                around <span className="font-bold">R.K.S.D College</span> only.
              </p>
              <p className="mt-2 text-blue-800">
                Full features, live student records, and advanced AI navigation
                are still under development.
              </p>
            </div>

            <div className="mt-6">
              <h4 className="font-bold text-lg text-gray-900 mb-3">
                Right now, you can try:
              </h4>
              <ul className="space-y-2">
                {[
                  "Finding classrooms and departments",
                  "Getting faculty & office info",
                  "Finding labs, library, canteen, admin, etc.",
                  "Asking real-life student queries",
                ].map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-gray-700"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-bold text-lg text-orange-900 mb-3">
                Try asking questions like:
              </h4>
              <ul className="space-y-2 text-gray-800">
                {[
                  "Where is BCA Second Year classroom?",
                  "Find Computer Science Department",
                  "Who is the librarian?",
                  "Where is principal office?",
                  "Show me Science Block route",
                  "When is my next class? (demo sample reply)",
                ].map((text, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-orange-500">•</span>
                    <code className="bg-white px-2 py-1 rounded text-sm">
                      {text}
                    </code>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded flex items-start gap-3 mb-6">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-amber-900">Note:</p>
                <p className="text-amber-800 mt-1">
                  This version uses sample campus data. Live campus mapping &
                  permissions for real data are in progress.
                </p>
              </div>
            </div>
          </div>

          {/* Footer (Button) */}
          <div className="flex-shrink-0 p-6 pt-4 border-t border-gray-200 bg-white">
            <Button
              onClick={() => {
                setDemoModal(null);
                setLocation("/assistant");
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-6 text-lg shadow-lg"
            >
              Continue to Demo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Court Demo Modal */}
      <Dialog
        open={demoModal === "court"}
        onOpenChange={() => setDemoModal(null)}
      >
        <DialogContent className="max-w-2xl h-[90vh] flex flex-col bg-white text-gray-900 border-2 border-purple-300 shadow-2xl p-0">
          {/* Header */}
          <div className="flex-shrink-0 p-6 pb-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-purple-600 flex items-center gap-2">
                <Scale className="h-7 w-7" /> Court Navigation Demo Preview
              </DialogTitle>
            </DialogHeader>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 text-gray-700 text-base space-y-4">
            <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
              <p className="font-semibold text-purple-900">
                This is a concept demo, trained on synthetic{" "}
                <span className="font-bold">Kaithal Court</span> layout data.
              </p>
              <p className="mt-2 text-purple-800">
                Real court data requires official approval and will be
                integrated later.
              </p>
            </div>

            <div className="mt-6">
              <h4 className="font-bold text-lg text-gray-900 mb-3">
                In this demo, you can explore:
              </h4>
              <ul className="space-y-2">
                {[
                  "Courtroom direction system",
                  "Judge block & chamber samples",
                  "Office & registry routing",
                  "Common legal visitor guidance",
                ].map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-gray-700"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h4 className="font-bold text-lg text-purple-900 mb-3">
                Try asking:
              </h4>
              <ul className="space-y-2 text-gray-800">
                {[
                  "Where is Courtroom 12?",
                  "Where can I find a typist?",
                  "Which block has Judge Chambers?",
                  "Where is Registry Office?",
                  "Show way to Gate No. 2",
                ].map((text, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-purple-500">•</span>
                    <code className="bg-white px-2 py-1 rounded text-sm">
                      {text}
                    </code>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-bold text-lg text-blue-900 mb-3">
                Example map ranges you can explore:
              </h4>
              <ul className="space-y-1 text-gray-800">
                {["Rooms 20 to 30", "Rooms 50 to 55", "Rooms 70 to 79"].map(
                  (text, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <span>{text}</span>
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4 rounded flex items-start gap-3 mb-6">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-semibold text-red-900">Disclaimer:</p>
                <p className="text-red-800 mt-1">
                  This data is not real. It is designed only to preview future
                  capabilities.
                </p>
              </div>
            </div>
          </div>

          {/* Footer (Button) */}
          <div className="flex-shrink-0 p-6 pt-4 border-t border-gray-200 bg-white">
            <Button
              onClick={() => {
                setDemoModal(null);
                setLocation("/court-assistant");
              }}
              className="w-full bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-bold py-6 text-lg shadow-lg"
            >
              Continue to Demo
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
