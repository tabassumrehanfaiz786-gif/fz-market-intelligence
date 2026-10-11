import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
const SessionContext=createContext<{user:User|null;ready:boolean}>({user:null,ready:false});
export function SessionProvider({children}:{children:ReactNode}){const [user,setUser]=useState<User|null>(null);const [ready,setReady]=useState(false);const router=useRouter();const queryClient=useQueryClient();useEffect(()=>{let active=true;const {data}=supabase.auth.onAuthStateChange((event,session)=>{if(!active)return;if(['INITIAL_SESSION','SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event)){setUser(session?.user??null);setReady(true);}if(['SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event)){void router.invalidate();if(event!=='SIGNED_OUT')void queryClient.invalidateQueries();}});void supabase.auth.getUser().then(({data})=>{if(active){setUser(data.user);setReady(true);}});return()=>{active=false;data.subscription.unsubscribe();};},[router,queryClient]);return <SessionContext.Provider value={{user,ready}}>{children}</SessionContext.Provider>;}
export const useSession=()=>useContext(SessionContext);
