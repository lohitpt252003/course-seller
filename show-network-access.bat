@echo off
echo ===================================================
echo     COURSE SELLER - LOCAL NETWORK ACCESS
echo ===================================================
echo.
echo The application and API are configured to be accessed
echo over your local network!
echo.
echo Your local network IP addresses are:
echo ---------------------------------------------------
ipconfig | findstr /R /C:"IPv4 Address"
echo ---------------------------------------------------
echo.
echo Tell people on your network to open their browser
echo and go to:
echo.
echo     [Frontend Website]
echo     http://[YOUR_IP_ADDRESS_FROM_ABOVE]:3000
echo.
echo     [Backend API Docs / Swagger]
echo     http://[YOUR_IP_ADDRESS_FROM_ABOVE]:8000/docs
echo.
echo     [Backend API Base URL]
echo     http://[YOUR_IP_ADDRESS_FROM_ABOVE]:8000/api
echo.
echo Make sure your Docker containers are running using:
echo     docker-compose up -d
echo.
pause
