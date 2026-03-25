import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User, Briefcase, Building, GraduationCap, Award, CheckCircle2, X, Image as ImageIcon } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { TRANSLATIONS } from '../constants';

interface MentorOnboardingProps {
  lang: string;
  onComplete: () => void;
}

const MentorOnboarding = ({ lang, onComplete }: MentorOnboardingProps) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.English;
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    company: '',
    experience: '',
    expertise: '',
    bio: '',
    image: ''
  });

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    setIsSubmitting(true);
    
    try {
      const mentorData = {
        uid: auth.currentUser.uid,
        name: formData.name,
        role: formData.role,
        company: formData.company,
        experience: formData.experience,
        expertise: formData.expertise.split(',').map(s => s.trim()),
        bio: formData.bio,
        image: formData.image || `https://picsum.photos/seed/${auth.currentUser.uid}/200/200`,
        xp: 0,
        badges: [],
        sessionsCount: 0,
        rating: 5.0,
        isVerified: false,
        createdAt: Timestamp.now()
      };

      await setDoc(doc(db, 'mentors', auth.currentUser.uid), mentorData);
      onComplete();
    } catch (error) {
      console.error("Error signing up as mentor:", error);
      alert("Failed to sign up. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="max-w-md mx-auto w-full px-8 py-12 flex-1 flex flex-col">
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black">M</div>
            <h1 className="text-xl font-black text-gray-900 uppercase tracking-tight">Mentor Portal</h1>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className={cn("h-1 flex-1 rounded-full transition-all", s <= step ? "bg-blue-600" : "bg-gray-100")} />
            ))}
          </div>
        </div>

        <div className="flex-1">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Basic Info</h2>
              <p className="text-gray-500 mb-8">Tell us who you are and what you do.</p>
              
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold"
                  />
                </div>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Current Role (e.g. Senior Developer)"
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold"
                  />
                </div>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Company"
                    value={formData.company}
                    onChange={e => setFormData({...formData, company: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Expertise</h2>
              <p className="text-gray-500 mb-8">What can you help students with?</p>
              
              <div className="space-y-4">
                <div className="relative">
                  <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Years of Experience"
                    value={formData.experience}
                    onChange={e => setFormData({...formData, experience: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold"
                  />
                </div>
                <div className="relative">
                  <Award className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                  <textarea 
                    placeholder="Expertise (comma separated, e.g. React, Python, Design)"
                    value={formData.expertise}
                    onChange={e => setFormData({...formData, expertise: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold h-32 resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <h2 className="text-3xl font-black text-gray-900 mb-2">Final Touches</h2>
              <p className="text-gray-500 mb-8">A short bio and a profile picture.</p>
              
              <div className="space-y-4">
                <div className="relative">
                  <textarea 
                    placeholder="Short Bio"
                    value={formData.bio}
                    onChange={e => setFormData({...formData, bio: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-4 outline-none focus:border-blue-500 transition-all font-bold h-32 resize-none"
                  />
                </div>
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Profile Image URL (Optional)"
                    value={formData.image}
                    onChange={e => setFormData({...formData, image: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500 transition-all font-bold"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="mt-12 flex gap-4">
          {step > 1 && (
            <button 
              onClick={() => setStep(step - 1)}
              className="flex-1 py-4 rounded-2xl border-2 border-gray-100 text-gray-400 font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
            >
              Back
            </button>
          )}
          <button 
            onClick={() => {
              if (step < 3) setStep(step + 1);
              else handleSubmit();
            }}
            disabled={isSubmitting}
            className="flex-[2] py-4 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Submitting..." : step === 3 ? "Finish Signup" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MentorOnboarding;
