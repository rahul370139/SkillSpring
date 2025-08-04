"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    question: "I prefer hands-on, practical work over theoretical concepts",
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
  { name: "SQL", category: "Technology", icon: BarChart3 },
  { name: "Machine Learning", category: "Technology", icon: Zap },
  { name: "UI/UX Design", category: "Design", icon: Palette },
  { name: "Graphic Design", category: "Design", icon: Palette },
  { name: "Figma", category: "Design", icon: Palette },
  { name: "Adobe Creative Suite", category: "Design", icon: Palette },
  { name: "Data Analysis", category: "Analytics", icon: BarChart3 },
  { name: "Excel", category: "Analytics", icon: BarChart3 },
  { name: "Tableau", category: "Analytics", icon: BarChart3 },
  { name: "Google Analytics", category: "Analytics", icon: BarChart3 },
  { name: "Project Management", category: "Management", icon: Target },
  { name: "Leadership", category: "Management", icon: Users },
  { name: "Communication", category: "Management", icon: Users },
  { name: "Digital Marketing", category: "Marketing", icon: Globe },
  { name: "SEO", category: "Marketing", icon: Globe },
  { name: "Content Writing", category: "Marketing", icon: Globe },
]

const interestSuggestions = [
  { name: "Technology", icon: Code },
  { name: "Design", icon: Palette },
  { name: "Business", icon: Briefcase },
  { name: "Data Science", icon: BarChart3 },
  { name: "Artificial Intelligence", icon: Brain },
  { name: "Marketing", icon: Globe },
  { name: "Education", icon: Users },
  { name: "Healthcare", icon: Heart },
  { name: "Finance", icon: TrendingUp },
  { name: "Creative Arts", icon: Music },
  { name: "Photography", icon: Camera },
  { name: "Engineering", icon: Wrench },
]

const mockCareerResults = [
  {
    title: "Software Engineer",
    match: 92,
    description: "Design and develop software applications using various programming languages and frameworks.",
    icon: Code,
    skills: ["JavaScript", "Python", "React", "Node.js"],
    salary: "$75,000 - $150,000",
  },
  {
    title: "UX/UI Designer",
    match: 88,
    description: "Create intuitive and visually appealing user interfaces for digital products.",
    icon: Palette,
    skills: ["Figma", "Adobe Creative Suite", "User Research", "Prototyping"],
    salary: "$60,000 - $120,000",
  },
  {
    title: "Data Analyst",
    match: 85,
    description: "Analyze complex data sets to help organizations make informed business decisions.",
    icon: BarChart3,
    skills: ["SQL", "Python", "Tableau", "Statistics"],
    salary: "$55,000 - $100,000",
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

  const handleNext = () => {
    if (currentStep < assessmentQuestions.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
        setShowResults(true)
      }, 2000)
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
    {} as Record<string, typeof skillSuggestions>,
  )

  // Get available suggestions (not already selected)
  const getAvailableSkillSuggestions = () => {
    return Object.entries(groupedSkills).reduce(
      (acc, [category, skills]) => {
        const availableSkills = skills.filter((skill) => !selectedSkills.includes(skill.name))
        if (availableSkills.length > 0) {
          acc[category] = availableSkills
        }
        return acc
      },
      {} as Record<string, typeof skillSuggestions>,
    )
  }

  const getAvailableInterestSuggestions = () => {
    return interestSuggestions.filter((interest) => !selectedInterests.includes(interest.name))
  }

  const getAvailableRoleSuggestions = () => {
    const popularRoles = [
      "Software Engineer",
      "Data Scientist",
      "UX Designer",
      "Product Manager",
      "Digital Marketer",
      "DevOps Engineer",
    ]
    return popularRoles.filter((role) => role !== targetRole)
  }

  // Assessment Loading Screen
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Zap className="h-8 w-8 text-white animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold">Analyzing Your Responses...</h2>
            <p className="text-muted-foreground">Finding the perfect career matches for you</p>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Your Career Matches
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Based on your responses, here are the careers that align best with your interests and preferences.
            </p>
          </div>

          <div className="grid gap-6">
            {mockCareerResults.map((career, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                        <career.icon className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {career.title}
                        </CardTitle>
                        <CardDescription className="text-sm">{career.description}</CardDescription>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">{career.salary}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant="secondary"
                        className="text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                      >
                        {career.match}%
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">Match</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Key Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {career.skills.map((skill, skillIndex) => (
                          <Badge key={skillIndex} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                      Generate Learning Roadmap
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
              className="mr-4 bg-transparent"
            >
              Back to Career Tools
            </Button>
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Career Assessment
            </h1>
            <p className="text-muted-foreground">
              Question {currentStep + 1} of {assessmentQuestions.length}
            </p>
            <Progress value={progress} className="w-full" />
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl">Question {currentStep + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-lg leading-relaxed">{currentQuestion.question}</p>

              <RadioGroup
                value={answers[currentQuestion.id] || ""}
                onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
                className="space-y-3"
              >
                {likertOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center space-x-3 p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex-1 cursor-pointer text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="flex items-center gap-2 bg-transparent"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canGoNext}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {currentStep === assessmentQuestions.length - 1 ? "Get Results" : "Next"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Main Career Page with Roadmap Generator
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Career Roadmap Generator
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create a personalized learning roadmap based on your skills, interests, and career goals.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="target" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="target">Target Role</TabsTrigger>
                <TabsTrigger value="interests">Interests</TabsTrigger>
                <TabsTrigger value="skills">Skills</TabsTrigger>
              </TabsList>

              <TabsContent value="target" className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      What's Your Target Career Role?
                    </CardTitle>
                    <CardDescription>Enter the job title or career path you're aiming for</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="target-role">Target Career Role</Label>
                      <Input
                        id="target-role"
                        placeholder="e.g., Frontend Developer, Data Scientist, Product Manager"
                        value={targetRole}
                        onChange={(e) => setTargetRole(e.target.value)}
                        className="text-lg p-6"
                      />
                    </div>

                    {getAvailableRoleSuggestions().length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-muted-foreground">Popular Roles:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {getAvailableRoleSuggestions().map((role) => (
                            <Button
                              key={role}
                              variant="outline"
                              size="sm"
                              onClick={() => setTargetRole(role)}
                              className="justify-start bg-transparent hover:bg-accent"
                            >
                              {role}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="interests" className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5" />
                      Select Your Interests
                    </CardTitle>
                    <CardDescription>Choose areas that genuinely interest and motivate you</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="custom-interest">Add Interest</Label>
                      <div className="flex gap-2">
                        <Input
                          id="custom-interest"
                          placeholder="Enter an interest area..."
                          value={customInterest}
                          onChange={(e) => setCustomInterest(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && addCustomInterest()}
                        />
                        <Button onClick={addCustomInterest} disabled={!customInterest.trim()}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {selectedInterests.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Selected Interests:</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedInterests.map((interest) => (
                            <Badge key={interest} variant="default" className="flex items-center gap-1">
                              {interest}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-red-500"
                                onClick={() => removeInterest(interest)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {getAvailableInterestSuggestions().length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-muted-foreground">Interest Areas:</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {getAvailableInterestSuggestions().map((interest) => (
                            <Button
                              key={interest.name}
                              variant="outline"
                              onClick={() => addInterest(interest.name)}
                              className="justify-start h-auto p-4 bg-transparent hover:bg-accent"
                            >
                              <interest.icon className="h-4 w-4 mr-2" />
                              {interest.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="skills" className="space-y-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      Select Your Skills
                    </CardTitle>
                    <CardDescription>Choose your current skills or skills you want to develop</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="custom-skill">Add Skill</Label>
                      <div className="flex gap-2">
                        <Input
                          id="custom-skill"
                          placeholder="Enter a skill..."
                          value={customSkill}
                          onChange={(e) => setCustomSkill(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && addCustomSkill()}
                        />
                        <Button onClick={addCustomSkill} disabled={!customSkill.trim()}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {selectedSkills.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Selected Skills:</Label>
                        <div className="flex flex-wrap gap-2">
                          {selectedSkills.map((skill) => (
                            <Badge key={skill} variant="default" className="flex items-center gap-1">
                              {skill}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-red-500"
                                onClick={() => removeSkill(skill)}
                              />
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {Object.keys(getAvailableSkillSuggestions()).length > 0 && (
                      <div className="space-y-4">
                        {Object.entries(getAvailableSkillSuggestions()).map(([category, skills]) => (
                          <div key={category} className="space-y-3">
                            <Label className="text-sm font-medium text-muted-foreground">{category}:</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {skills.map((skill) => (
                                <Button
                                  key={skill.name}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addSkill(skill.name)}
                                  className="justify-start h-auto p-3 bg-transparent hover:bg-accent"
                                >
                                  <skill.icon className="h-4 w-4 mr-2" />
                                  {skill.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <HelpCircle className="h-5 w-5" />
                  No Clue?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Not sure what career path to choose? Take our quick assessment to discover careers that match your
                  personality and interests.
                </p>
                <Button
                  onClick={() => setShowAssessment(true)}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Take the Quiz
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5" />
                  Your Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Target Role:</span>
                    <Badge variant={targetRole ? "default" : "secondary"}>{targetRole ? "✓" : "Pending"}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Interests:</span>
                    <Badge variant={selectedInterests.length > 0 ? "default" : "secondary"}>
                      {selectedInterests.length > 0 ? `${selectedInterests.length} selected` : "None"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Skills:</span>
                    <Badge variant={selectedSkills.length > 0 ? "default" : "secondary"}>
                      {selectedSkills.length > 0 ? `${selectedSkills.length} selected` : "None"}
                    </Badge>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  disabled={!targetRole || selectedInterests.length === 0 || selectedSkills.length === 0}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Generate Roadmap
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
