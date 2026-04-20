import type {errorTypes} from "../errors/errorTypes"

function isApiError(e: unknown): e is ApiError {
  return (
    typeof e === "object" &&
    e !== null &&
    "status" in e
  );
}