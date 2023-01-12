import express, { NextFunction, Request, Response } from "express";
import { setTimeout as setTimeoutPromise } from "node:timers/promises";
// import "express-async-errors";
import asyncHandler from "express-async-handler";

const app = express();

const port = 3000;

app.get("/", (req, res) => {
	res.send("Hello World!");
});

// The error is caught by the custom error handling middleware.
// If there was no custom middleware defined later, default error handling happens: it logs and returns a 500 with the callstack.
app.get("/boom", (req, res) => {
	throw new Error("BOOM!");
	res.send("Hello World!");
});

app.get("/async", async (req, res) => {
	await setTimeoutPromise(2000);
	res.send("Hello async!");
});

// - if using express-async-errors: the error is passed through next to the error handler middleware
// - else: the error is not caught and the server crashes, the default nor the custom error handling mw catch the async error.
app.get("/async/boom0", async (req, res, next) => {
	await setTimeoutPromise(2000);
	throw new Error("ASYNC BOOM!");
	res.send("Hello async!");
});

// The server does not crash anymore but this is verbose.
app.get("/async/boom1", async (req, res, next) => {
	try {
		await setTimeoutPromise(2000);
		throw new Error("ASYNC BOOM!");
		res.send("Hello async!");
	} catch (error: any) {
		console.log("Error caught by the async handler itself");
		next(error);
	}
});

// This does not work because the await in the error handler mw does not actually await.
app.get(
	"/async/boom2",
	async (req, res, next) => {
		try {
			console.log("before next 0");
			await next(); // This does not actually await.
			console.log("after next 0");
		} catch (error: any) {
			console.log("Error caught by a custom mw");
			next(error);
		}
	},
	async (req, res, next) => {
		console.log("event handler start");
		await setTimeoutPromise(2000);
		throw new Error("ASYNC BOOM!");
		res.send("Hello async!");
		console.log("event handler done");
	}
);

// When chaining async handlers, be careful to put next at the end because it cannot be awaited.
app.get(
	"/async2",
	async (req, res, next) => {
		console.log("before next 0");
		await setTimeoutPromise(1000);
		(req as any).user = "foo";
		next();
		console.log("after next 0");
	},
	async (req, res, next) => {
		console.log("event handler start", (req as any).user);
		await setTimeoutPromise(2000);
		// throw new Error("ASYNC BOOM!");
		res.send("Hello async!");
		console.log("event handler done");
	}
);

// This works fine
app.get(
	"/async/boom89",
	asyncHandler(async (req, res, next) => {
		await setTimeoutPromise(2000);
		throw new Error("ASYNC BOOM!");
		res.send("Hello async!");
	})
);

// But it does not allow chaining
app.get(
	"/async99",
	asyncHandler(async (req, res, next) => {
		console.log("before next 0");
		await setTimeoutPromise(1000);
		(req as any).user = "foo";
		await next();
		console.log("after next 0");
	}),
	asyncHandler(async (req, res, next) => {
		console.log("event handler start", (req as any).user);
		await setTimeoutPromise(2000);
		// throw new Error("ASYNC BOOM!");
		res.send("Hello async!");
		console.log("event handler done");
	})
);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	res.status(500).send(`An error occured: ${err.message}`);
});

app.listen(port, () => {
	console.log(`Example app listening on port ${port}`);
});
