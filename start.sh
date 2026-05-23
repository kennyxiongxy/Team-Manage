#!/bin/zsh
cd "$(dirname "$0")"

# 启动后端
echo "Starting backend on port 3001..."
cd server
/opt/homebrew/bin/node node_modules/.bin/tsx src/index.ts &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# 等待后端就绪
for i in $(seq 1 10); do
  if curl -s -o /dev/null -w "" http://localhost:3001/health 2>/dev/null; then
    echo "Backend ready"
    break
  fi
  sleep 1
done

# 启动前端
echo "Starting frontend on port 3000..."
cd ..
/opt/homebrew/bin/node node_modules/.bin/vite --port 3000 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "======================================"
echo " Services started!"
echo " Frontend: http://localhost:3000"
echo " Backend:  http://localhost:3001"
echo "======================================"
echo ""
echo "Press Ctrl+C to stop all services."
echo ""

# 等待任一进程退出
wait $BACKEND_PID $FRONTEND_PID
