import express, { Application } from "express";
import socketIO, { Server as SocketIOServer } from "socket.io";
import { createServer, Server as HTTPServer } from "http";
 
export class Server {

    private httpServer: HTTPServer;
    private app: Application;
    private io: SocketIOServer;
    private activeSockets: string[] = [];
    
    private readonly DEFAULT_PORT = 8000;
    
    constructor() {
        this.initialize();
        
        this.handleRoutes();
        this.handleSocketConnection();
    }
    
    private initialize(): void {
        this.app = express();
        this.httpServer = createServer(this.app);
        this.io = socketIO(this.httpServer);
    }
    
    private handleRoutes(): void {

        this.io.on("connection", socket => {

            const existingSocket = this.activeSockets.find(
                existingSocket => existingSocket === socket.id
            );
        
            if (!existingSocket) {

                this.activeSockets.push(socket.id)
                console.log("push", this.activeSockets)
                
        
                socket.emit("update-user-list", {
                    users: this.activeSockets.filter(
                        existingSocket => existingSocket !== socket.id
                    )
                })
        
                socket.broadcast.emit("update-user-list", {
                    users: [socket.id]
                })

            }

            socket.on("disconnect", () => {

                this.activeSockets = this.activeSockets.filter(
                  existingSocket => existingSocket !== socket.id
                )

                socket.broadcast.emit("remove-user", {
                  socketId: socket.id
                })

                socket.broadcast.emit("ended")

            })

            socket.on("call", data => {
                
                let to = this.activeSockets.filter(soc => soc !== socket.id)

                if (to.length < 1) return
                
                socket.to(to[0]).emit("incoming", {
                    offer: data.offer,
                    socket: socket.id
                })

            })

            socket.on("accept-call", data => {

                let to = this.activeSockets.filter(soc => soc !== socket.id)

                if (to.length < 1) return

                
                socket.to(to[0]).emit("call-accepted", {
                  socket: socket.id,
                  answer: data.answer
                })
            })

            socket.on("send-candidate", data => {

                let to = this.activeSockets.filter(soc => soc !== socket.id)

                if (to.length < 1) return

                socket.to(to[0]).emit("candidate",data)

            })

            socket.on("end", data => {

                let to = this.activeSockets.filter(soc => soc !== socket.id)

                if (to.length < 1) return

                socket.to(to[0]).emit("ended")

            })

        })

    }
    
    private handleSocketConnection(): void {
        this.io.on("connection", socket => {
            console.log("Socket connected.");
        });
    }
    
    public listen(callback: (port: number) => void): void {
        this.httpServer.listen(this.DEFAULT_PORT, () =>
            callback(this.DEFAULT_PORT)
        );
    }

}