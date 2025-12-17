import MainSlidebar from "@/components/App_Components/MainSlidebar";
import { Outlet } from "react-router-dom";

export default function MainLayout(){
    return(
        <div className="flex h-screen overflow-hidden">
            <MainSlidebar />
            <main className="flex-1 overflow-y-auto bg-background">
                <Outlet />
            </main>
        </div>
    );
}