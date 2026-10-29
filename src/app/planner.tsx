import { useLocalSearchParams } from "expo-router";
import TripPlanner from "../components/planner/TripPlanner";

export default function PlannerScreen() {
  const { destination } = useLocalSearchParams<{ destination?: string }>();
  return (
    <TripPlanner
      key={destination ?? "blank"}
      initialDestination={destination ?? ""}
    />
  );
}
