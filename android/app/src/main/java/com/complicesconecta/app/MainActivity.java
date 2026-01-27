package com.complicesconecta.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.WindowManager;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends BridgeActivity {

    private static final int PERMISSIONS_REQUEST_CODE = 1240;
    private ScaleGestureDetector scaleGestureDetector;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Registrar plugin de protección de contenido
        registerPlugin(ContentProtectionPlugin.class);

        // Habilitar FLAG_SECURE automáticamente (Ley Olimpia)
        getWindow().setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        );

        if (checkAndRequestPermissions()) {
            // Permissions are already granted, proceed with app initialization
            initApp();
        }
        // else: wait for onRequestPermissionsResult
    }

    private void initApp() {
        // Initialize multi-touch gesture detector
        scaleGestureDetector = new ScaleGestureDetector(this, new ScaleListener());
    }

    private boolean checkAndRequestPermissions() {
        List<String> listPermissionsNeeded = new ArrayList<>();

        String[] commonPermissions = {
                Manifest.permission.CAMERA,
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION,
                Manifest.permission.RECORD_AUDIO
        };

        for (String p : commonPermissions) {
            if (ContextCompat.checkSelfPermission(this, p) != PackageManager.PERMISSION_GRANTED) {
                listPermissionsNeeded.add(p);
            }
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                listPermissionsNeeded.add(Manifest.permission.POST_NOTIFICATIONS);
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_IMAGES) != PackageManager.PERMISSION_GRANTED) {
                listPermissionsNeeded.add(Manifest.permission.READ_MEDIA_IMAGES);
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_MEDIA_VIDEO) != PackageManager.PERMISSION_GRANTED) {
                listPermissionsNeeded.add(Manifest.permission.READ_MEDIA_VIDEO);
            }
        } else {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.READ_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                listPermissionsNeeded.add(Manifest.permission.READ_EXTERNAL_STORAGE);
            }
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                listPermissionsNeeded.add(Manifest.permission.WRITE_EXTERNAL_STORAGE);
            }
        }

        if (!listPermissionsNeeded.isEmpty()) {
            ActivityCompat.requestPermissions(this, listPermissionsNeeded.toArray(new String[0]), PERMISSIONS_REQUEST_CODE);
            return false;
        }

        return true;
    }


    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == PERMISSIONS_REQUEST_CODE) {
            boolean allPermissionsGranted = true;
            if (grantResults.length > 0) {
                for (int grantResult : grantResults) {
                    if (grantResult != PackageManager.PERMISSION_GRANTED) {
                        allPermissionsGranted = false;
                        break;
                    }
                }
            } else { // No permissions were requested, or the dialog was dismissed.
                allPermissionsGranted = false;
            }


            if (allPermissionsGranted) {
                initApp();
            } else {
                Toast.makeText(this, "Todos los permisos son requeridos para usar la aplicación.", Toast.LENGTH_LONG).show();
                finish(); // Close the app if permissions are not granted
            }
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent event) {
        if (scaleGestureDetector != null) {
            scaleGestureDetector.onTouchEvent(event);
        }
        return super.onTouchEvent(event);
    }

    private class ScaleListener extends ScaleGestureDetector.SimpleOnScaleGestureListener {
        @Override
        public boolean onScale(ScaleGestureDetector detector) {
            // Handle scale gesture here
            // For example, you could pass the scale factor to your web view
            return true;
        }
    }
}
