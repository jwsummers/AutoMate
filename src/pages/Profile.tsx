import { useState, useEffect } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Shield, Bell, Camera, CreditCard } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import ReminderSettings from '@/components/settings/ReminderSettings';
import SubscriptionSettings from '@/components/settings/SubscriptionSettings';
import { supabase } from '@/integrations/supabase/client';

const MAX_AVATAR_MB = 5;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const Profile = () => {
  const [activeTab, setActiveTab] = useState<
    'account' | 'subscription' | 'notifications' | 'security'
  >('account');
  const { user, signOut, checkSubscription } = useAuth();
  const {
    profile,
    loading: profileLoading,
    updateProfile,
    uploadAvatar,
  } = useProfile();

  const [name, setName] = useState(profile?.full_name || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);

  // password state
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // throttle subscription checks (60s)
  const [lastSubCheck, setLastSubCheck] = useState<number>(0);

  // Update the name state when profile is loaded
  useEffect(() => {
    if (profile?.full_name) setName(profile.full_name);
  }, [profile]);

  // Refresh subscription data when tab changes to subscription (throttled)
  useEffect(() => {
    if (activeTab !== 'subscription') return;
    const now = Date.now();
    if (now - lastSubCheck > 60_000) {
      checkSubscription();
      setLastSubCheck(now);
    }
  }, [activeTab, checkSubscription, lastSubCheck]);

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsUpdating(true);
    try {
      await updateProfile({ full_name: name });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // capture the input element up-front so it doesn't go null later
    const inputEl = e.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    if (!file) return;

    // immediately clear the input so selecting the same file again re-fires change
    inputEl.value = '';

    // type/size validation
    const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_AVATAR_MB = 5;
    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      toast.error('Please upload a JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > MAX_AVATAR_MB * 1024 * 1024) {
      toast.error(`Avatar must be ≤ ${MAX_AVATAR_MB}MB.`);
      return;
    }

    setIsUploading(true);
    try {
      // Expect uploadAvatar to return the public (or signed) URL
      const url = await uploadAvatar(file);
      if (!url) {
        toast.error('Upload failed.');
        return;
      }

      // persist URL to profile
      await updateProfile({ avatar_url: url });

      // bump version so <img> reloads even if browser caches
      setAvatarVersion((v) => v + 1);

      toast.success('Avatar updated');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      setNewPassword('');
      toast.success('Password updated.');
    } catch (err) {
      console.error(err);
      toast.error('Could not update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : '?';

  return (
    <div className='min-h-screen flex flex-col bg-dark-bg'>
      <Navbar />

      <main className='flex-1 pt-28 pb-16'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-col md:flex-row justify-between items-start md:items-center mb-8'>
            <div>
              <h1 className='text-2xl font-bold mb-2'>Account Settings</h1>
              <p className='text-foreground/70'>
                Manage your profile, subscription, and preferences
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
            <div className='lg:col-span-1'>
              <Card className='bg-dark-card border-white/10 sticky top-28'>
                <CardContent className='p-4'>
                  <div className='flex flex-col items-center'>
                    <div className='relative mb-4 mt-2'>
                      <Avatar className='h-24 w-24 border-2 border-neon-blue'>
                        <AvatarImage
                          src={
                            profile?.avatar_url
                              ? `${profile.avatar_url}?v=${avatarVersion}`
                              : undefined
                          }
                        />

                        <AvatarFallback className='bg-neon-blue/20 text-neon-blue text-lg'>
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>

                      <label
                        htmlFor='avatar-upload'
                        className='absolute bottom-0 right-0 p-1.5 bg-neon-blue rounded-full cursor-pointer'
                        aria-label='Upload avatar'
                      >
                        <Camera className='h-4 w-4 text-black' />
                        <input
                          type='file'
                          id='avatar-upload'
                          className='hidden'
                          accept='image/*'
                          onChange={handleAvatarChange}
                          disabled={isUploading}
                        />
                      </label>
                    </div>

                    <p className='font-medium text-lg'>
                      {profile?.full_name || 'Your Name'}
                    </p>
                    <p className='text-foreground/70 text-sm'>{user?.email}</p>
                  </div>

                  <div className='mt-6 space-y-1'>
                    <Tabs
                      value={activeTab}
                      onValueChange={(v) => setActiveTab(v as typeof activeTab)}
                    >
                      <TabsList className='flex flex-col bg-transparent space-y-1 h-auto'>
                        <TabsTrigger
                          value='account'
                          className='w-full justify-start px-3 py-2 data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue'
                        >
                          <User className='h-4 w-4 mr-2' />
                          <span>Account</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value='subscription'
                          className='w-full justify-start px-3 py-2 data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue'
                        >
                          <CreditCard className='h-4 w-4 mr-2' />
                          <span>Subscription</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value='notifications'
                          className='w-full justify-start px-3 py-2 data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue'
                        >
                          <Bell className='h-4 w-4 mr-2' />
                          <span>Notifications</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value='security'
                          className='w-full justify-start px-3 py-2 data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue'
                        >
                          <Shield className='h-4 w-4 mr-2' />
                          <span>Security</span>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className='mt-6 pt-6 border-t border-white/10'>
                    <Button
                      variant='ghost'
                      className='w-full justify-start px-3 py-2 hover:bg-white/10 hover:text-red-400'
                      onClick={() => signOut()}
                    >
                      Sign out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className='lg:col-span-3'>
              <Tabs
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as typeof activeTab)}
                className='w-full'
              >
                <TabsContent value='account' className='mt-0'>
                  <Card className='bg-dark-card border-white/10'>
                    <CardHeader>
                      <div className='flex items-center gap-2'>
                        <User className='h-5 w-5 text-neon-blue' />
                        <CardTitle>Personal Information</CardTitle>
                      </div>
                      <CardDescription>
                        Update your account details and personal information
                      </CardDescription>
                    </CardHeader>

                    <CardContent className='space-y-6'>
                      <div className='space-y-2'>
                        <Label htmlFor='name'>Full Name</Label>
                        <Input
                          id='name'
                          type='text'
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder='Your full name'
                          className='bg-white/5 border-white/10 focus-visible:ring-neon-blue'
                        />
                      </div>

                      <div className='space-y-2'>
                        <Label htmlFor='email'>Email Address</Label>
                        <Input
                          id='email'
                          type='email'
                          value={user?.email || ''}
                          disabled
                          className='bg-white/5 border-white/10 text-foreground/70'
                        />
                        <p className='text-xs text-foreground/50'>
                          Your email address cannot be changed
                        </p>
                      </div>
                    </CardContent>

                    <CardFooter className='border-t border-white/10 pt-6'>
                      <Button
                        onClick={handleUpdateProfile}
                        disabled={isUpdating || profileLoading}
                        className='bg-neon-blue hover:bg-neon-blue/90 text-black'
                      >
                        {isUpdating ? 'Updating...' : 'Update Profile'}
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value='subscription' className='mt-0'>
                  <SubscriptionSettings />
                </TabsContent>

                <TabsContent value='notifications' className='mt-0'>
                  <ReminderSettings />
                </TabsContent>

                <TabsContent value='security' className='mt-0'>
                  <Card className='bg-dark-card border-white/10'>
                    <CardHeader>
                      <div className='flex items-center gap-2'>
                        <Shield className='h-5 w-5 text-neon-blue' />
                        <CardTitle>Security Settings</CardTitle>
                      </div>
                      <CardDescription>
                        Manage your password and security preferences
                      </CardDescription>
                    </CardHeader>

                    <CardContent className='space-y-6'>
                      <div className='space-y-2'>
                        <Label htmlFor='password'>Change Password</Label>
                        <div className='flex flex-col sm:flex-row gap-3'>
                          <Input
                            id='password'
                            type='password'
                            placeholder='New password'
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className='bg-white/5 border-white/10 focus-visible:ring-neon-blue'
                          />
                          <Button
                            variant='outline'
                            onClick={handleChangePassword}
                            disabled={isChangingPassword}
                          >
                            {isChangingPassword ? 'Updating...' : 'Update'}
                          </Button>
                        </div>
                        <p className='text-xs text-foreground/60'>
                          Use at least 8 characters. Consider a password manager
                          for unique passwords.
                        </p>
                      </div>

                      <div className='border-t border-white/10 pt-6'>
                        <div className='flex items-start gap-2'>
                          <Shield className='h-5 w-5 text-foreground/70' />
                          <p className='text-sm text-foreground/70'>
                            For added security, we recommend using a strong,
                            unique password that you don't use for other
                            websites.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
