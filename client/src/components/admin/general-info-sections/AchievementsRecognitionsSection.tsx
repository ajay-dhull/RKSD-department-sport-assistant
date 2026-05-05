import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit, Save, Award, Trophy, Star, Medal, Briefcase, GraduationCap, Users } from "lucide-react";

interface AchievementsRecognitionsSectionProps {
  data: any;
  onUpdate: () => void;
}

export function AchievementsRecognitionsSection({ data, onUpdate }: AchievementsRecognitionsSectionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("adminToken");
  
  const [formData, setFormData] = useState({
    rusa_grant: "In 2018, RKSD College was selected under the Rashtriya Uchchtar Shiksha Abhiyan (RUSA 2.0) for infrastructure and quality enhancement.",
    rusa_grant_amount: "₹ 2 Crore",
    rusa_grant_year: "2018",
    rusa_funds_utilized: "Construction of a double-storey canteen, New toilet block, Central air-conditioning for the main library. This grant significantly modernized campus facilities.",
    
    environmental_initiatives: "Two solar power plants installed for sustainable energy use — 120 KVA Plant (Nov 2018) and 43 KVA Plant (2019–20) (funded under RUSA 2.0). These initiatives reduced the college's carbon footprint and promoted eco-awareness.",
    solar_plant_1: "120 KVA (November 2018)",
    solar_plant_2: "43 KVA (2019-20)",
    
    infrastructure_excellence: "Campus spans 10 acres with fully air-conditioned seminar halls, rich library, modern laboratories, and an indoor sports stadium meeting international standards. Recognized under UGC Sections 2(f) and 12(b), ensuring eligibility for central funding and research grants.",
    
    naac_grade: "A",
    naac_cycle: "2nd Cycle – 2017",
    naac_description: "Accredited with 'A' Grade by National Assessment and Accreditation Council (NAAC) in its second cycle (2017) — reflecting high academic and infrastructural quality.",
    
    recognition_reputation: "RKSD College is consistently acknowledged as one of Haryana's top colleges for academic excellence, discipline, and extracurricular success. Received positive mentions on higher-education ranking platforms such as UniversityKart and Shiksha.com.",
    
    faculty_qualified: "The college boasts well-qualified and dedicated faculty across streams including Commerce, Science, Arts, Education, and Computer Science.",
    faculty_international: "The Department of English organized RKSD's first International Conference (2012). A research project supervised by Dr. Geeta Goyal earned an international award for innovation in education.",
    faculty_research: "Multiple faculty members serve as Board of Studies Members at Kurukshetra University. Faculty such as Dr. O.P. Saini (NCERT Recognition) and Dr. Shilpy Aggarwal (Subject Expert, Hindi NCERT 2018) have earned national acknowledgments. Active participation in community service, extension, and IQAC quality initiatives.",
    
    cultural_excellence_trophies: "Inter-Zonal Youth Festival: RKSD College dominated the festival scene, winning the Overall Trophy five consecutive years (2003–2009).",
    cultural_43rd_festival: "43rd Zonal Youth Festival (2020–21): Won the Overall Trophy, securing 27 medals (13 First places) in singing, dance, and drama events. Participation in 29 items demonstrated the college's cultural versatility.",
    cultural_state_level: "State-Level Recognition: Consistently wins awards at Haryana's state cultural fest 'Ratnavali.'",
    
    sports_university: "Regular top performer in KUK Inter-College Championships, winning medals in Boxing, Wushu, and Judo.",
    sports_national_international: "Students have represented Haryana and India, winning medals at National & International Meets.",
    sports_notable_athlete: "Manisha Moun, Indian Boxer and international medalist, is a proud alumna of RKSD College.",
    
    alumni_distinguished: "RKSD alumni have excelled in government, academia, business, sports, and public service.",
    alumni_judiciary_1: "Mr. Arvind Bansal - Chief Judicial Magistrate, Jind",
    alumni_judiciary_2: "Mr. Rakesh Kaushik - Civil Judge, Tohana",
    alumni_politics: "Mr. Leela Ram - MLA, Kaithal",
    alumni_police: "Mr. Vikrant Saini - Assistant Sub Inspector, Haryana Police",
    alumni_defence: "Mr. Kuldeep - Indian Army Personnel",
    alumni_sports: "Manisha Moun - International Boxer, Team India",
    alumni_association: "The college maintains an active alumni association, organizing annual meets, mentorship programmes, and fundraising for student welfare and scholarships.",
    
    ugc_status: "Recognized under 2(f) & 12(b)",
    last_verified: "October 2025",
  });

  const [isEditing, setIsEditing] = useState(false);

  const { data: achievementsData } = useQuery({
    queryKey: ["/api/admin/general-info/achievements-recognitions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/general-info/achievements-recognitions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    },
  });

  useEffect(() => {
    if (achievementsData) {
      setFormData({
        rusa_grant: achievementsData.rusa_grant || formData.rusa_grant,
        rusa_grant_amount: achievementsData.rusa_grant_amount || formData.rusa_grant_amount,
        rusa_grant_year: achievementsData.rusa_grant_year || formData.rusa_grant_year,
        rusa_funds_utilized: achievementsData.rusa_funds_utilized || formData.rusa_funds_utilized,
        environmental_initiatives: achievementsData.environmental_initiatives || formData.environmental_initiatives,
        solar_plant_1: achievementsData.solar_plant_1 || formData.solar_plant_1,
        solar_plant_2: achievementsData.solar_plant_2 || formData.solar_plant_2,
        infrastructure_excellence: achievementsData.infrastructure_excellence || formData.infrastructure_excellence,
        naac_grade: achievementsData.naac_grade || formData.naac_grade,
        naac_cycle: achievementsData.naac_cycle || formData.naac_cycle,
        naac_description: achievementsData.naac_description || formData.naac_description,
        recognition_reputation: achievementsData.recognition_reputation || formData.recognition_reputation,
        faculty_qualified: achievementsData.faculty_qualified || formData.faculty_qualified,
        faculty_international: achievementsData.faculty_international || formData.faculty_international,
        faculty_research: achievementsData.faculty_research || formData.faculty_research,
        cultural_excellence_trophies: achievementsData.cultural_excellence_trophies || formData.cultural_excellence_trophies,
        cultural_43rd_festival: achievementsData.cultural_43rd_festival || formData.cultural_43rd_festival,
        cultural_state_level: achievementsData.cultural_state_level || formData.cultural_state_level,
        sports_university: achievementsData.sports_university || formData.sports_university,
        sports_national_international: achievementsData.sports_national_international || formData.sports_national_international,
        sports_notable_athlete: achievementsData.sports_notable_athlete || formData.sports_notable_athlete,
        alumni_distinguished: achievementsData.alumni_distinguished || formData.alumni_distinguished,
        alumni_judiciary_1: achievementsData.alumni_judiciary_1 || formData.alumni_judiciary_1,
        alumni_judiciary_2: achievementsData.alumni_judiciary_2 || formData.alumni_judiciary_2,
        alumni_politics: achievementsData.alumni_politics || formData.alumni_politics,
        alumni_police: achievementsData.alumni_police || formData.alumni_police,
        alumni_defence: achievementsData.alumni_defence || formData.alumni_defence,
        alumni_sports: achievementsData.alumni_sports || formData.alumni_sports,
        alumni_association: achievementsData.alumni_association || formData.alumni_association,
        ugc_status: achievementsData.ugc_status || formData.ugc_status,
        last_verified: achievementsData.last_verified || formData.last_verified,
      });
    }
  }, [achievementsData]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch("/api/admin/general-info/achievements-recognitions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Achievements & Recognitions information updated successfully" });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/general-info/achievements-recognitions"] });
      onUpdate();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Achievements & Recognitions</h2>
          <p className="text-sm text-gray-600">Manage college awards, achievements, and notable alumni</p>
        </div>
        <Button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          disabled={saveMutation.isPending}
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              {saveMutation.isPending ? "Saving..." : "Save Changes"}
            </>
          ) : (
            <>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            RUSA 2.0 Grant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="rusa_grant">Grant Description</Label>
            {isEditing ? (
              <Textarea
                id="rusa_grant"
                value={formData.rusa_grant}
                onChange={(e) => setFormData({ ...formData, rusa_grant: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.rusa_grant}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rusa_grant_amount">Grant Amount</Label>
              {isEditing ? (
                <Input
                  id="rusa_grant_amount"
                  value={formData.rusa_grant_amount}
                  onChange={(e) => setFormData({ ...formData, rusa_grant_amount: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-700 mt-1">{formData.rusa_grant_amount}</p>
              )}
            </div>
            <div>
              <Label htmlFor="rusa_grant_year">Year</Label>
              {isEditing ? (
                <Input
                  id="rusa_grant_year"
                  value={formData.rusa_grant_year}
                  onChange={(e) => setFormData({ ...formData, rusa_grant_year: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-700 mt-1">{formData.rusa_grant_year}</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="rusa_funds_utilized">Funds Utilized For</Label>
            {isEditing ? (
              <Textarea
                id="rusa_funds_utilized"
                value={formData.rusa_funds_utilized}
                onChange={(e) => setFormData({ ...formData, rusa_funds_utilized: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.rusa_funds_utilized}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-green-600" />
            Environmental Initiatives
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="environmental_initiatives">Overview</Label>
            {isEditing ? (
              <Textarea
                id="environmental_initiatives"
                value={formData.environmental_initiatives}
                onChange={(e) => setFormData({ ...formData, environmental_initiatives: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.environmental_initiatives}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="solar_plant_1">Solar Plant 1</Label>
              {isEditing ? (
                <Input
                  id="solar_plant_1"
                  value={formData.solar_plant_1}
                  onChange={(e) => setFormData({ ...formData, solar_plant_1: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-700 mt-1">{formData.solar_plant_1}</p>
              )}
            </div>
            <div>
              <Label htmlFor="solar_plant_2">Solar Plant 2</Label>
              {isEditing ? (
                <Input
                  id="solar_plant_2"
                  value={formData.solar_plant_2}
                  onChange={(e) => setFormData({ ...formData, solar_plant_2: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-700 mt-1">{formData.solar_plant_2}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-600" />
            Infrastructure Excellence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="infrastructure_excellence">Details</Label>
            {isEditing ? (
              <Textarea
                id="infrastructure_excellence"
                value={formData.infrastructure_excellence}
                onChange={(e) => setFormData({ ...formData, infrastructure_excellence: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.infrastructure_excellence}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-purple-600" />
            NAAC Grade & Rankings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="naac_grade">NAAC Grade</Label>
              {isEditing ? (
                <Input
                  id="naac_grade"
                  value={formData.naac_grade}
                  onChange={(e) => setFormData({ ...formData, naac_grade: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-700 mt-1">{formData.naac_grade}</p>
              )}
            </div>
            <div>
              <Label htmlFor="naac_cycle">Cycle</Label>
              {isEditing ? (
                <Input
                  id="naac_cycle"
                  value={formData.naac_cycle}
                  onChange={(e) => setFormData({ ...formData, naac_cycle: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-700 mt-1">{formData.naac_cycle}</p>
              )}
            </div>
          </div>
          <div>
            <Label htmlFor="naac_description">Description</Label>
            {isEditing ? (
              <Textarea
                id="naac_description"
                value={formData.naac_description}
                onChange={(e) => setFormData({ ...formData, naac_description: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.naac_description}</p>
            )}
          </div>
          <div>
            <Label htmlFor="recognition_reputation">Recognition & Reputation</Label>
            {isEditing ? (
              <Textarea
                id="recognition_reputation"
                value={formData.recognition_reputation}
                onChange={(e) => setFormData({ ...formData, recognition_reputation: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.recognition_reputation}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-indigo-600" />
            Faculty Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="faculty_qualified">Highly Qualified Faculty</Label>
            {isEditing ? (
              <Textarea
                id="faculty_qualified"
                value={formData.faculty_qualified}
                onChange={(e) => setFormData({ ...formData, faculty_qualified: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.faculty_qualified}</p>
            )}
          </div>
          <div>
            <Label htmlFor="faculty_international">International Recognition</Label>
            {isEditing ? (
              <Textarea
                id="faculty_international"
                value={formData.faculty_international}
                onChange={(e) => setFormData({ ...formData, faculty_international: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.faculty_international}</p>
            )}
          </div>
          <div>
            <Label htmlFor="faculty_research">Research & Outreach</Label>
            {isEditing ? (
              <Textarea
                id="faculty_research"
                value={formData.faculty_research}
                onChange={(e) => setFormData({ ...formData, faculty_research: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.faculty_research}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-pink-600" />
            Student Achievements - Cultural Excellence
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cultural_excellence_trophies">Inter-Zonal Youth Festival</Label>
            {isEditing ? (
              <Textarea
                id="cultural_excellence_trophies"
                value={formData.cultural_excellence_trophies}
                onChange={(e) => setFormData({ ...formData, cultural_excellence_trophies: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.cultural_excellence_trophies}</p>
            )}
          </div>
          <div>
            <Label htmlFor="cultural_43rd_festival">43rd Zonal Youth Festival (2020-21)</Label>
            {isEditing ? (
              <Textarea
                id="cultural_43rd_festival"
                value={formData.cultural_43rd_festival}
                onChange={(e) => setFormData({ ...formData, cultural_43rd_festival: e.target.value })}
                rows={3}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.cultural_43rd_festival}</p>
            )}
          </div>
          <div>
            <Label htmlFor="cultural_state_level">State-Level Recognition</Label>
            {isEditing ? (
              <Textarea
                id="cultural_state_level"
                value={formData.cultural_state_level}
                onChange={(e) => setFormData({ ...formData, cultural_state_level: e.target.value })}
                rows={1}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.cultural_state_level}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-orange-600" />
            Student Achievements - Sports Success
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sports_university">University Level</Label>
            {isEditing ? (
              <Textarea
                id="sports_university"
                value={formData.sports_university}
                onChange={(e) => setFormData({ ...formData, sports_university: e.target.value })}
                rows={1}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.sports_university}</p>
            )}
          </div>
          <div>
            <Label htmlFor="sports_national_international">National & International</Label>
            {isEditing ? (
              <Textarea
                id="sports_national_international"
                value={formData.sports_national_international}
                onChange={(e) => setFormData({ ...formData, sports_national_international: e.target.value })}
                rows={1}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.sports_national_international}</p>
            )}
          </div>
          <div>
            <Label htmlFor="sports_notable_athlete">Notable Athlete</Label>
            {isEditing ? (
              <Input
                id="sports_notable_athlete"
                value={formData.sports_notable_athlete}
                onChange={(e) => setFormData({ ...formData, sports_notable_athlete: e.target.value })}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.sports_notable_athlete}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            Alumni Highlights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="alumni_distinguished">Distinguished Network</Label>
            {isEditing ? (
              <Textarea
                id="alumni_distinguished"
                value={formData.alumni_distinguished}
                onChange={(e) => setFormData({ ...formData, alumni_distinguished: e.target.value })}
                rows={1}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.alumni_distinguished}</p>
            )}
          </div>
          
          <div className="space-y-3">
            <Label>Notable Alumni</Label>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label htmlFor="alumni_judiciary_1" className="text-xs text-gray-600">Judiciary 1</Label>
                {isEditing ? (
                  <Input
                    id="alumni_judiciary_1"
                    value={formData.alumni_judiciary_1}
                    onChange={(e) => setFormData({ ...formData, alumni_judiciary_1: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-gray-700 mt-1">{formData.alumni_judiciary_1}</p>
                )}
              </div>
              <div>
                <Label htmlFor="alumni_judiciary_2" className="text-xs text-gray-600">Judiciary 2</Label>
                {isEditing ? (
                  <Input
                    id="alumni_judiciary_2"
                    value={formData.alumni_judiciary_2}
                    onChange={(e) => setFormData({ ...formData, alumni_judiciary_2: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-gray-700 mt-1">{formData.alumni_judiciary_2}</p>
                )}
              </div>
              <div>
                <Label htmlFor="alumni_politics" className="text-xs text-gray-600">Politics</Label>
                {isEditing ? (
                  <Input
                    id="alumni_politics"
                    value={formData.alumni_politics}
                    onChange={(e) => setFormData({ ...formData, alumni_politics: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-gray-700 mt-1">{formData.alumni_politics}</p>
                )}
              </div>
              <div>
                <Label htmlFor="alumni_police" className="text-xs text-gray-600">Police</Label>
                {isEditing ? (
                  <Input
                    id="alumni_police"
                    value={formData.alumni_police}
                    onChange={(e) => setFormData({ ...formData, alumni_police: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-gray-700 mt-1">{formData.alumni_police}</p>
                )}
              </div>
              <div>
                <Label htmlFor="alumni_defence" className="text-xs text-gray-600">Defence</Label>
                {isEditing ? (
                  <Input
                    id="alumni_defence"
                    value={formData.alumni_defence}
                    onChange={(e) => setFormData({ ...formData, alumni_defence: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-gray-700 mt-1">{formData.alumni_defence}</p>
                )}
              </div>
              <div>
                <Label htmlFor="alumni_sports" className="text-xs text-gray-600">Sports</Label>
                {isEditing ? (
                  <Input
                    id="alumni_sports"
                    value={formData.alumni_sports}
                    onChange={(e) => setFormData({ ...formData, alumni_sports: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-gray-700 mt-1">{formData.alumni_sports}</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="alumni_association">Alumni Association</Label>
            {isEditing ? (
              <Textarea
                id="alumni_association"
                value={formData.alumni_association}
                onChange={(e) => setFormData({ ...formData, alumni_association: e.target.value })}
                rows={2}
                className="mt-1"
              />
            ) : (
              <p className="text-sm text-gray-700 mt-1">{formData.alumni_association}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-600" />
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ugc_status">UGC Status</Label>
              {isEditing ? (
                <Input
                  id="ugc_status"
                  value={formData.ugc_status}
                  onChange={(e) => setFormData({ ...formData, ugc_status: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-700 mt-1">{formData.ugc_status}</p>
              )}
            </div>
            <div>
              <Label htmlFor="last_verified">Last Verified</Label>
              {isEditing ? (
                <Input
                  id="last_verified"
                  value={formData.last_verified}
                  onChange={(e) => setFormData({ ...formData, last_verified: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <p className="text-sm text-gray-700 mt-1">{formData.last_verified}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {achievementsData?.updated_at && (
        <div className="text-xs text-gray-500 text-right">
          Last updated: {new Date(achievementsData.updated_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}
