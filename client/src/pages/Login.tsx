import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/ui/header";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Simple form schema
const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Login/Register page
export default function Login() {
  const [, navigate] = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const { toast } = useToast();
  
  // Get stored users
  const getUsers = (): Record<string, string> => {
    const users = localStorage.getItem("wine_cellar_users");
    return users ? JSON.parse(users) : {};
  };
  
  // Add a new user
  const addUser = (username: string, password: string): boolean => {
    const users = getUsers();
    if (users[username]) {
      return false;
    }
    
    users[username] = password;
    localStorage.setItem("wine_cellar_users", JSON.stringify(users));
    return true;
  };
  
  // Authenticate a user
  const authenticateUser = (username: string, password: string): boolean => {
    const users = getUsers();
    return users[username] === password;
  };
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isLogin) {
      // Login flow
      if (authenticateUser(values.username, values.password)) {
        localStorage.setItem("wine_cellar_current_user", values.username);
        toast({
          title: "Login successful",
          description: `Welcome back, ${values.username}!`,
        });
        navigate("/");
      } else {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: "Invalid username or password",
        });
      }
    } else {
      // Registration flow
      if (addUser(values.username, values.password)) {
        localStorage.setItem("wine_cellar_current_user", values.username);
        toast({
          title: "Registration successful",
          description: `Welcome to your wine cellar, ${values.username}!`,
        });
        navigate("/");
      } else {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: "Username already exists",
        });
      }
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header title="Cellars.me" />
      
      <main className="flex-1 container max-w-md px-4 py-8 mx-auto">
        <Card className="w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {isLogin ? "Welcome Back" : "Create an Account"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin
                ? "Enter your credentials to access your wine cellar"
                : "Register to start tracking your wine collection"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Your username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full">
                  {isLogin ? "Login" : "Register"}
                </Button>
              </form>
            </Form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}
              <Button
                variant="link"
                className="pl-1.5 pr-0 py-0 h-auto"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Register" : "Login"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}