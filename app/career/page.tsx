"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import {
  Plus,
  X,
  Code,
  Palette,
  BarChart3,
  Users,
  Globe,
  Zap,
  Target,
  Heart,
  Music,
  Camera,
  Wrench,
  Briefcase,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  HelpCircle,
  Brain,
  Upload,
} from "lucide-react"

// Assessment Questions
const assessmentQuestions = [
  {
    id: 1,
    question: "I enjoy working with technology and solving technical problems",
    type: "likert",
  },
  {
    id: 2,
    question: "I prefer working independently rather than in large teams",
    type: "likert",
  },
  {
    id: 3,
    question: "I like analyzing data to find patterns and insights",
    type: "likert",
  },
  {
    id: 4,
    question: "I enjoy creating visual designs and user interfaces",
    type: "likert",
  },
  {
    id: 5,
    question: "I'm comfortable presenting ideas to groups of people",
    type: "likert",
  },
  {
    id: 6,
    question: "I prefer structured, predictable work environments",
    type: "likert",
  },
  {
    id: 7,
    question: "I enjoy mentoring and helping others learn",
    type: "likert",
  },
  {
    id: 8,
    question: "I like working on long-term strategic projects",
    type: "likert",
  },
  {
    id: 9,
    question: "I'm energized by fast-paced, changing environments",
    type: "likert",
  },
  {
    id: 10,
    question: "I enjoy learning new technologies and staying updated with industry trends",
    type: "likert",
  },
]

const likertOptions = [
  { value: "1", label: "Strongly Disagree" },
  { value: "2", label: "Disagree" },
  { value: "3", label: "Neutral" },
  { value: "4", label: "Agree" },
  { value: "5", label: "Strongly Agree" },
]

// Skill and Interest Suggestions
const skillSuggestions = [
  { name: "JavaScript", category: "Technology", icon: Code },
  { name: "Python", category: "Technology", icon: Code },
  { name: "React", category: "Technology", icon: Code },
  { name: "Node.js", category: "Technology", icon: Code },
  { name: "SQL", category: "Technology", icon: Code },
  { name: "Git", category: "Technology", icon: Code },
  { name: "UI/UX Design", category: "Design", icon: Palette },
  { name: "Graphic Design", category: "Design", icon: Palette },
  { name: "Figma", category: "Design", icon: Palette },
  { name: "Adobe Creative Suite", category: "Design", icon: Palette },
  { name: "Data Analysis", category: "Business", icon: BarChart3 },
  { name: "Project Management", category: "Business", icon: Briefcase },
  { name: "Marketing", category: "Business", icon: TrendingUp },
  { name: "SEO", category: "Business", icon: TrendingUp },
  { name: "Content Writing", category: "Business", icon: Globe },
  { name: "Public Speaking", category: "Communication", icon: Users },
  { name: "Leadership", category: "Communication", icon: Users },
  { name: "Team Collaboration", category: "Communication", icon: Users },
]

const interestSuggestions = [
  { name: "Technology", category: "Tech", icon: Code },
  { name: "Design", category: "Creative", icon: Palette },
  { name: "Business", category: "Professional", icon: Briefcase },
  { name: "Data Science", category: "Tech", icon: BarChart3 },
  { name: "Marketing", category: "Business", icon: TrendingUp },
  { name: "Music", category: "Creative", icon: Music },
  { name: "Photography", category: "Creative", icon: Camera },
  { name: "Travel", category: "Lifestyle", icon: Globe },
  { name: "Fitness", category: "Health", icon: Wrench },
]

const roleSuggestions = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Scientist",
  "Product Manager",
  "UI/UX Designer",
  "DevOps Engineer",
  "Mobile Developer",
  "Data Analyst",
  "Software Engineer",
  "Project Manager",
  "Marketing Manager",
  "Content Creator",
  "Business Analyst",
]

const mockCareerResults = [
  {
    title: "Software Engineer",
    description: "Build and maintain software applications and systems",
    salary: "$80,000 - $150,000",
    match: 95,
    skills: ["JavaScript", "Python", "React", "Node.js", "Git"],
    icon: Code,
  },
  {
    title: "Data Scientist",
    description: "Analyze complex data to help organizations make better decisions",
    salary: "$90,000 - $160,000",
    match: 88,
    skills: ["Python", "SQL", "Machine Learning", "Statistics", "Data Analysis"],
    icon: BarChart3,
  },
  {
    title: "Product Manager",
    description: "Lead product development and strategy",
    salary: "$85,000 - $140,000",
    match: 82,
    skills: ["Project Management", "Data Analysis", "Leadership", "Communication", "Strategy"],
    icon: Briefcase,
  },
]

export default function CareerPage() {
  const [showAssessment, setShowAssessment] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Roadmap Generator State
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [customSkill, setCustomSkill] = useState("")
  const [customInterest, setCustomInterest] = useState("")
  const [targetRole, setTargetRole] = useState("")

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleNext = async () => {
    if (currentStep < assessmentQuestions.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      setIsLoading(true)
      try {
        const answersArray = Object.values(answers).map(answer => parseInt(answer))
        
        const response = await fetch("https://trainbackend-production.up.railway.app/api/career/match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answers: answersArray,
            owner_id: "user-123",
            user_profile: {
              experience_level: "beginner",
              interests: ["technology", "problem-solving"]
            }
          }),
        })

        if (response.ok) {
          const result = await response.json()
          console.log("Career matches:", result)
          setIsLoading(false)
          setShowResults(true)
        } else {
          throw new Error("Career matching failed")
        }
      } catch (error) {
        console.error("Career matching failed:", error)
        setIsLoading(false)
        setShowResults(true)
      }
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1)
  }

  const addSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill])
    }
  }

  const removeSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skill))
  }

  const addCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills([...selectedSkills, customSkill.trim()])
      setCustomSkill("")
    }
  }

  const addInterest = (interest: string) => {
    if (!selectedInterests.includes(interest)) {
      setSelectedInterests([...selectedInterests, interest])
    }
  }

  const removeInterest = (interest: string) => {
    setSelectedInterests(selectedInterests.filter((i) => i !== interest))
  }

  const addCustomInterest = () => {
    if (customInterest.trim() && !selectedInterests.includes(customInterest.trim())) {
      setSelectedInterests([...selectedInterests, customInterest.trim()])
      setCustomInterest("")
    }
  }

  const groupedSkills = skillSuggestions.reduce(
    (acc, skill) => {
      if (!acc[skill.category]) {
        acc[skill.category] = []
      }
      acc[skill.category].push(skill)
      return acc
    },
    {} as Record<string, typeof skillSuggestions>
  )

  const getAvailableSkillSuggestions = () => {
    return skillSuggestions.filter(
      (skill) => !selectedSkills.includes(skill.name)
    )
  }

  const getAvailableInterestSuggestions = () => {
    return interestSuggestions.filter(
      (interest) => !selectedInterests.includes(interest.name)
    )
  }

  const getAvailableRoleSuggestions = () => {
    return roleSuggestions
  }

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Zap className="h-8 w-8 text-white animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold text-white">Analyzing Your Responses...</h2>
            <p className="text-blue-200">Finding the perfect career matches for you</p>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full animate-pulse"
              style={{ width: "75%" }}
            ></div>
          </div>
        </div>
      </div>
    )
  }

  // Assessment Results Screen
  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-white">
                Your Career Matches
              </h1>
              <p className="text-blue-200 max-w-2xl mx-auto">
                Based on your responses, here are the careers that align best with your interests and preferences.
              </p>
            </div>

            <div className="grid gap-6">
              {mockCareerResults.map((career, index) => (
                <div key={index} className="group hover:shadow-lg transition-all duration-300 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-blue-500/20 shadow-2xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        <career.icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors">
                          {career.title}
                        </h3>
                        <p className="text-sm text-blue-200">{career.description}</p>
                        <p className="text-sm font-medium text-green-400">{career.salary}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="secondary"
                        className="text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                      >
                        {career.match}%
                      </Badge>
                      <p className="text-xs text-blue-300 mt-1">Match</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2 text-blue-200">Key Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {career.skills.map((skill, skillIndex) => (
                          <Badge key={skillIndex} variant="outline" className="text-xs bg-blue-600/20 border-blue-400/30 text-blue-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      Generate Learning Roadmap
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center space-y-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResults(false)
                  setShowAssessment(false)
                  setCurrentStep(0)
                  setAnswers({})
                }}
                className="mr-4 bg-slate-800/50 border-slate-600 text-blue-200 hover:bg-slate-700/50"
              >
                Back to Career Tools
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Assessment Questions Screen
  if (showAssessment) {
    const currentQuestion = assessmentQuestions[currentStep]
    const canGoNext = answers[currentQuestion?.id] !== undefined
    const progress = ((currentStep + 1) / assessmentQuestions.length) * 100

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-white">
                Career Assessment
              </h1>
              <p className="text-blue-200">
                Question {currentStep + 1} of {assessmentQuestions.length}
              </p>
              <Progress value={progress} className="w-full bg-slate-700" />
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-blue-500/20 shadow-2xl p-8">
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-white">Question {currentStep + 1}</h2>
                <p className="text-lg leading-relaxed text-blue-100">{currentQuestion.question}</p>

                <RadioGroup
                  value={answers[currentQuestion.id] || ""}
                  onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                  className="space-y-3"
                >
                  {likertOptions.map((option) => (
                    <div
                      key={option.value}
                      className="flex items-center space-x-3 p-4 rounded-lg hover:bg-slate-700/50 transition-colors border border-slate-600/30"
                    >
                      <RadioGroupItem value={option.value} id={option.value} className="text-blue-500" />
                      <Label htmlFor={option.value} className="flex-1 cursor-pointer text-sm text-blue-100">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2 bg-slate-800/50 border-slate-600 text-blue-200 hover:bg-slate-700/50"
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canGoNext}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                {currentStep === assessmentQuestions.length - 1 ? "Get Results" : "Next"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main Career Page with Roadmap Generator
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center space-y-6 mb-12">
            <h1 className="text-5xl font-bold text-white">
              Career Planning
            </h1>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Define your career goals to get started
            </p>
          </div>

          {/* Main Form Container */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-blue-500/20 shadow-2xl p-8 space-y-8">
            {/* Interests Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">What are your interests?</h2>
              
              {/* Suggested Interests */}
              <div className="flex flex-wrap gap-3 mb-4">
                {getAvailableInterestSuggestions().slice(0, 3).map((interest) => (
                  <Button
                    key={interest.name}
                    variant="outline"
                    onClick={() => addInterest(interest.name)}
                    className="bg-blue-600/20 border-blue-400/30 text-blue-200 hover:bg-blue-600/30 hover:border-blue-400/50"
                  >
                    {interest.name}
                  </Button>
                ))}
              </div>
              
              {/* Custom Interest Input */}
              <div className="flex gap-3">
                <Input
                  placeholder="Enter an interest"
                  value={customInterest}
                  onChange={(e) => setCustomInterest(e.target.value)}
                  className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
                <Button
                  onClick={addCustomInterest}
                  disabled={!customInterest.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Other
                </Button>
              </div>
            </div>

            {/* Skills Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">What skills do you have?</h2>
              
              {/* Suggested Skills */}
              <div className="flex flex-wrap gap-3 mb-4">
                {getAvailableSkillSuggestions().slice(0, 3).map((skill) => (
                  <Button
                    key={skill.name}
                    variant="outline"
                    onClick={() => addSkill(skill.name)}
                    className="bg-blue-600/20 border-blue-400/30 text-blue-200 hover:bg-blue-600/30 hover:border-blue-400/50"
                  >
                    {skill.name}
                  </Button>
                ))}
              </div>
              
              {/* Custom Skill Input */}
              <div className="flex gap-3">
                <Input
                  placeholder="Enter a skill"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
                <Button
                  onClick={addCustomSkill}
                  disabled={!customSkill.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Other
                </Button>
              </div>
            </div>

            {/* Resume Upload Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Upload your resume</h2>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 bg-blue-600/20 border-blue-400/30 text-blue-200 hover:bg-blue-600/30 hover:border-blue-400/50 h-12"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Upload Resume
                </Button>
                <Button
                  variant="outline"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Other
                </Button>
              </div>
            </div>

            {/* Continue Button */}
            <div className="pt-6">
              <Button
                onClick={() => setShowAssessment(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 text-lg font-semibold"
              >
                Continue
              </Button>
            </div>
          </div>

          {/* Selected Items Display */}
          {(selectedInterests.length > 0 || selectedSkills.length > 0) && (
            <div className="mt-8 bg-slate-800/30 rounded-xl p-6 border border-blue-500/20">
              <h3 className="text-lg font-semibold text-white mb-4">Your Selections</h3>
              
              {selectedInterests.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-blue-200 mb-2">Interests:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedInterests.map((interest, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-blue-600/30 text-blue-200 border-blue-400/30"
                      >
                        {interest}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeInterest(interest)}
                          className="ml-2 h-4 w-4 p-0 hover:bg-blue-600/50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedSkills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-blue-200 mb-2">Skills:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.map((skill, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-purple-600/30 text-purple-200 border-purple-400/30"
                      >
                        {skill}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSkill(skill)}
                          className="ml-2 h-4 w-4 p-0 hover:bg-purple-600/50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
