package com.anthpal.xtv;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Debe registrarse antes de super.onCreate().
        registerPlugin(XtvUpdaterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
