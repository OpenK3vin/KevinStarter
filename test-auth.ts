import { auth } from "./src/lib/auth"

async function test() {
  try {
    const res = await auth.api.signInEmail({
      body: {
        email: "test@example.com",
        password: "password123"
      },
      headers: new Headers()
    })
    console.log("Success:", res)
  } catch (e: any) {
    console.log("Error:", e.body || e)
  }
}
test()
