"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
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
  Lightbulb,
  Heart,
  Music,
  Camera,
  Wrench,
  Briefcase,
  TrendingUp,
} from "lucide-react"

const skillSuggestions = [
  { name: "JavaScript", category: "Technology", icon: Code, color: "bg-yellow-500" },
  { name: "Python", category: "Technology", icon: Code, color: "bg-blue-500" },
  { name: "React", category: "Technology", icon: Code, color: "bg-cyan-500" },
  { name: "Node.js", category: "Technology", icon: Code, color: "bg-green-500" },
  { name: "SQL", category: "Technology", icon: BarChart3, color: "bg-orange-500" },
  { name: "Machine Learning", category: "Technology", icon: Zap, color: "bg-purple-500" },
  { name: "UI/UX Design", category: "Design", icon: Palette, color: "bg-pink-500" },
  { name: "Graphic Design", category: "Design", icon: Palette, color: "bg-red-500" },
  { name: "Figma", category: "Design", icon: Palette, color: "bg-indigo-500" },
  { name: "Adobe Creative Suite", category: "Design", icon: Palette, color: "bg-purple-600" },
  { name: "Data Analysis", category: "Analytics", icon: BarChart3, color: "bg-blue-600" },
  { name: "Excel", category: "Analytics", icon: BarChart3, color: "bg-green-600" },
  { name: "Tableau", category: "Analytics", icon: BarChart3, color: "bg-orange-600" },
  { name: "Google Analytics", category: "Analytics", icon: BarChart3, color: "bg-red-600" },
  { name: "Project Management", category: "Management", icon: Target, color: "bg-teal-500" },
  { name: "Leadership", category: "Management", icon: Users, color: "bg-amber-500" },
  { name: "Communication", category: "Management", icon: Users, color: "bg-lime-500" },
  { name: "Digital Marketing", category: "Marketing", icon: Globe, color: "bg-sky-500" },
  { name: "SEO", category: "Marketing", icon: Globe, color: "bg-emerald-500" },
  { name: "Content Writing", category: "Marketing", icon: Globe, color: "bg-violet-500" },
]

const interestSuggestions = [
  { name: "Technology", icon: Code, color: "bg-blue-500" },
  { name: "Design", icon: Palette, color: "bg-pink-500" },
  { name: "Business", icon: Briefcase, color: "bg-green-500" },
  { name: "Analytics", icon: BarChart3, color: "bg-purple-500" },
  { name: "Marketing", icon: Globe, color: "bg-orange-500" },
  { name: "Education", icon: Users, color: "bg-teal-500" },
  { name: "Healthcare", icon: Heart, color: "bg-red-500" },
  { name: "Finance", icon: TrendingUp, color: "bg-yellow-500" },
  { name: "Creative Arts", icon: Music, color: "bg-indigo-500" },
  { name: "Photography", icon: Camera, color: "bg-cyan-500" },
  { name: "Engineering", icon: Wrench, color: "bg-gray-500" },
  { name: "Innovation", icon: Lightbulb, color: "bg-amber-500" },
]

export default function RoadmapGeneratorPage() {
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [customSkill, setCustomSkill] = useState("")
  const [customInterest, setCustomInterest] = useState("")
  const [careerGoal, setCareerGoal] = useState("")
  const [timeline, setTimeline] = useState("")
  const [currentRole, setCurrentRole] = useState("")

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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Career Roadmap Generator
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create a personalized learning roadmap based on your skills, interests, and career goals.
          </p>
        </div>

        <Tabs defaultValue="skills" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="interests">Interests</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          </TabsList>

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
                {/* Selected Skills */}
                {selectedSkills.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Selected Skills:</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedSkills.map((skill) => (
                        <Badge key={skill} variant="default" className="flex items-center gap-1">
                          {skill}
                          <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => removeSkill(skill)} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skill Suggestions by Category */}
                <div className="space-y-4">
                  {Object.entries(groupedSkills).map(([category, skills]) => (
                    <div key={category} className="space-y-2">
                      <Label className="text-sm font-medium text-primary">{category}</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {skills.map((skill) => (
                          <Button
                            key={skill.name}
                            variant={selectedSkills.includes(skill.name) ? "default" : "outline"}
                            size="sm"
                            onClick={() => addSkill(skill.name)}
                            className="justify-start h-auto p-3"
                            disabled={selectedSkills.includes(skill.name)}
                          >
                            <div className={`w-3 h-3 rounded-full ${skill.color} mr-2`} />
                            <skill.icon className="h-4 w-4 mr-2" />
                            {skill.name}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom Skill Input */}
                <div className="space-y-2">
                  <Label htmlFor="custom-skill">Add Custom Skill</Label>
                  <div className="flex gap-2">
                    <Input
                      id="custom-skill"
                      placeholder="Enter a custom skill..."
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addCustomSkill()}
                    />
                    <Button onClick={addCustomSkill} disabled={!customSkill.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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
                {/* Selected Interests */}
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

                {/* Interest Suggestions */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Interest Areas</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {interestSuggestions.map((interest) => (
                      <Button
                        key={interest.name}
                        variant={selectedInterests.includes(interest.name) ? "default" : "outline"}
                        onClick={() => addInterest(interest.name)}
                        className="justify-start h-auto p-4"
                        disabled={selectedInterests.includes(interest.name)}
                      >
                        <div className={`w-4 h-4 rounded-full ${interest.color} mr-3`} />
                        <interest.icon className="h-5 w-5 mr-2" />
                        {interest.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Custom Interest Input */}
                <div className="space-y-2">
                  <Label htmlFor="custom-interest">Add Custom Interest</Label>
                  <div className="flex gap-2">
                    <Input
                      id="custom-interest"
                      placeholder="Enter a custom interest..."
                      value={customInterest}
                      onChange={(e) => setCustomInterest(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addCustomInterest()}
                    />
                    <Button onClick={addCustomInterest} disabled={!customInterest.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Define Your Goals
                </CardTitle>
                <CardDescription>Tell us about your career aspirations and timeline</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="current-role">Current Role/Position</Label>
                  <Input
                    id="current-role"
                    placeholder="e.g., Junior Developer, Student, Career Changer"
                    value={currentRole}
                    onChange={(e) => setCurrentRole(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="career-goal">Career Goal</Label>
                  <Textarea
                    id="career-goal"
                    placeholder="Describe your ideal career goal or target position..."
                    value={careerGoal}
                    onChange={(e) => setCareerGoal(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeline">Timeline</Label>
                  <Input
                    id="timeline"
                    placeholder="e.g., 6 months, 1 year, 2 years"
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roadmap" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Your Personalized Roadmap
                </CardTitle>
                <CardDescription>Based on your skills, interests, and goals</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSkills.length === 0 && selectedInterests.length === 0 && !careerGoal ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Complete the previous tabs to generate your personalized roadmap</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <h4 className="font-medium">Your Skills ({selectedSkills.length})</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedSkills.slice(0, 5).map((skill) => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {selectedSkills.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{selectedSkills.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium">Your Interests ({selectedInterests.length})</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedInterests.slice(0, 5).map((interest) => (
                            <Badge key={interest} variant="secondary" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                          {selectedInterests.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{selectedInterests.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                      Generate My Roadmap
                      <TrendingUp className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
