
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Lock, 
  CreditCard, 
  Bell, 
  LogOut, 
  Edit, 
  Trash2,
  Shield,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';

const Profile = () => {
  const [activeTab, setActiveTab] = useState("personal");
  
  return (
    <div className="min-h-screen flex flex-col bg-dark-bg">
      <Navbar />
      
      <main className="flex-1 pt-28 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8 mb-10">
              <div className="md:w-1/3">
                <Card className="bg-dark-card border-white/10">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-4">
                        <Avatar className="w-24 h-24 border-2 border-white/10">
                          <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="User avatar" />
                          <AvatarFallback className="bg-neon-blue/20 text-neon-blue text-2xl">JD</AvatarFallback>
                        </Avatar>
                        <button className="absolute bottom-0 right-0 rounded-full bg-neon-blue w-8 h-8 flex items-center justify-center text-black">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <h1 className="text-2xl font-bold mb-1">John Doe</h1>
                      <p className="text-foreground/70 mb-4">john.doe@example.com</p>
                      
                      <div className="flex gap-2 mb-6">
                        <div className="px-3 py-1 rounded-full text-xs bg-neon-blue/10 text-neon-blue border border-neon-blue/20">
                          Premium Plan
                        </div>
                      </div>
                      
                      <div className="w-full">
                        <Button variant="outline" size="sm" className="w-full mb-2 border-white/10 hover:bg-white/5 gap-2">
                          <Shield className="w-4 h-4" />
                          <span>Upgrade Plan</span>
                        </Button>
                        <Button variant="outline" size="sm" className="w-full text-red-400 border-red-400/20 hover:bg-red-500/10 hover:text-red-300 gap-2">
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="md:w-2/3">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-dark-card border border-white/10 p-1 mb-8">
                    <TabsTrigger value="personal" className="data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue">
                      <User className="h-4 w-4 mr-2" />
                      <span>Personal</span>
                    </TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue">
                      <Lock className="h-4 w-4 mr-2" />
                      <span>Security</span>
                    </TabsTrigger>
                    <TabsTrigger value="billing" className="data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue">
                      <CreditCard className="h-4 w-4 mr-2" />
                      <span>Billing</span>
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="data-[state=active]:bg-white/10 data-[state=active]:text-neon-blue">
                      <Bell className="h-4 w-4 mr-2" />
                      <span>Notifications</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="personal" className="mt-0 space-y-6 animate-fade-in">
                    <Card className="bg-dark-card border-white/10">
                      <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
                        
                        <form className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">First Name</label>
                              <input
                                className="w-full p-2 rounded-md bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
                                defaultValue="John"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Last Name</label>
                              <input
                                className="w-full p-2 rounded-md bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
                                defaultValue="Doe"
                              />
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <input
                              type="email"
                              className="w-full p-2 rounded-md bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
                              defaultValue="john.doe@example.com"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Phone Number</label>
                            <input
                              type="tel"
                              className="w-full p-2 rounded-md bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
                              defaultValue="+1 (555) 123-4567"
                            />
                          </div>
                          
                          <div className="flex justify-end pt-4">
                            <Button className="bg-neon-blue hover:bg-neon-blue/90 text-black font-medium">
                              Save Changes
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="security" className="mt-0 space-y-6 animate-fade-in">
                    <Card className="bg-dark-card border-white/10">
                      <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-6">Change Password</h2>
                        
                        <form className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Current Password</label>
                            <input
                              type="password"
                              className="w-full p-2 rounded-md bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
                              placeholder="••••••••"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">New Password</label>
                            <input
                              type="password"
                              className="w-full p-2 rounded-md bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
                              placeholder="••••••••"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Confirm New Password</label>
                            <input
                              type="password"
                              className="w-full p-2 rounded-md bg-dark-bg border border-white/10 focus:border-neon-blue focus:outline-none"
                              placeholder="••••••••"
                            />
                          </div>
                          
                          <div className="flex justify-end pt-4">
                            <Button className="bg-neon-blue hover:bg-neon-blue/90 text-black font-medium">
                              Update Password
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-dark-card border-white/10">
                      <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-6">Two-Factor Authentication</h2>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Protect your account with 2FA</p>
                            <p className="text-sm text-foreground/70">Add an extra layer of security to your account</p>
                          </div>
                          <Button variant="outline" className="border-white/10 hover:bg-white/5">
                            Enable
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-dark-card border-white/10">
                      <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-6">Delete Account</h2>
                        
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Permanently delete your account</p>
                            <p className="text-sm text-foreground/70">This action cannot be undone. All your data will be permanently removed.</p>
                          </div>
                          <Button variant="outline" className="text-red-400 border-red-400/20 hover:bg-red-500/10 hover:text-red-300 gap-2">
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="billing" className="mt-0 space-y-6 animate-fade-in">
                    <Card className="bg-dark-card border-white/10">
                      <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-6">Current Plan</h2>
                        
                        <div className="bg-white/5 rounded-lg p-4 mb-6">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-lg">Premium Plan</span>
                                <span className="px-2 py-0.5 text-xs rounded-full bg-neon-blue text-black font-medium">
                                  Current
                                </span>
                              </div>
                              <p className="text-foreground/70 text-sm">Billed annually</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">$9.99<span className="text-sm font-normal text-foreground/70">/month</span></div>
                              <p className="text-foreground/70 text-sm">Next billing on Nov 15, 2023</p>
                            </div>
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-2 text-sm mb-2">
                              <CheckCircle className="text-neon-blue w-4 h-4" />
                              <span>Up to 3 vehicles</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm mb-2">
                              <CheckCircle className="text-neon-blue w-4 h-4" />
                              <span>Advanced maintenance analytics</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm mb-2">
                              <CheckCircle className="text-neon-blue w-4 h-4" />
                              <span>Unlimited AI assistant access</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <CheckCircle className="text-neon-blue w-4 h-4" />
                              <span>Priority support</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button variant="outline" className="border-white/10 hover:bg-white/5">
                            Change Plan
                          </Button>
                          <Button variant="outline" className="text-red-400 border-red-400/20 hover:bg-red-500/10 hover:text-red-300">
                            Cancel Subscription
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-dark-card border-white/10">
                      <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
                        
                        <div className="mb-4">
                          <div className="flex items-center justify-between p-3 border border-white/10 rounded-md mb-3">
                            <div className="flex items-center gap-3">
                              <div className="bg-white/10 w-10 h-10 rounded flex items-center justify-center">
                                <CreditCard className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-medium">•••• •••• •••• 4242</p>
                                <p className="text-sm text-foreground/70">Expires 04/25</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button className="p-1.5 hover:bg-white/5 rounded-md">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="p-1.5 hover:bg-white/5 rounded-md text-red-400 hover:text-red-300">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <Button variant="outline" className="border-white/10 hover:bg-white/5 gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span>Add Payment Method</span>
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-dark-card border-white/10">
                      <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-6">Billing History</h2>
                        
                        <div className="space-y-3">
                          {[
                            { date: "Oct 15, 2023", amount: "$9.99", status: "Paid" },
                            { date: "Sep 15, 2023", amount: "$9.99", status: "Paid" },
                            { date: "Aug 15, 2023", amount: "$9.99", status: "Paid" }
                          ].map((invoice, i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                              <div>
                                <p className="font-medium">Premium Plan</p>
                                <p className="text-sm text-foreground/70">{invoice.date}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-medium">{invoice.amount}</span>
                                <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/10 text-green-500 font-medium">
                                  {invoice.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="notifications" className="mt-0 space-y-6 animate-fade-in">
                    <Card className="bg-dark-card border-white/10">
                      <CardContent className="p-6">
                        <h2 className="text-xl font-semibold mb-6">Notification Settings</h2>
                        
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-3 border-b border-white/10">
                            <div>
                              <p className="font-medium">Maintenance Reminders</p>
                              <p className="text-sm text-foreground/70">Get notified when your vehicle needs service</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
                            </label>
                          </div>
                          
                          <div className="flex items-center justify-between py-3 border-b border-white/10">
                            <div>
                              <p className="font-medium">Recall Alerts</p>
                              <p className="text-sm text-foreground/70">Be informed about safety recalls for your vehicles</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
                            </label>
                          </div>
                          
                          <div className="flex items-center justify-between py-3 border-b border-white/10">
                            <div>
                              <p className="font-medium">Tips & Advice</p>
                              <p className="text-sm text-foreground/70">Receive periodic car maintenance tips</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" />
                              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
                            </label>
                          </div>
                          
                          <div className="flex items-center justify-between py-3 border-b border-white/10">
                            <div>
                              <p className="font-medium">Email Notifications</p>
                              <p className="text-sm text-foreground/70">Receive notifications via email</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
                            </label>
                          </div>
                          
                          <div className="flex items-center justify-between py-3">
                            <div>
                              <p className="font-medium">Push Notifications</p>
                              <p className="text-sm text-foreground/70">Receive notifications on your device</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" className="sr-only peer" defaultChecked />
                              <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue"></div>
                            </label>
                          </div>
                        </div>
                        
                        <div className="flex justify-end pt-6">
                          <Button className="bg-neon-blue hover:bg-neon-blue/90 text-black font-medium">
                            Save Preferences
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
